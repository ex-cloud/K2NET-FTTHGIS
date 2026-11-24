export type SudoMethod = "webauthn" | "totp" | "email_otp" | "backup_code" | "password";

export interface SudoStatusResponse {
  elevated: boolean;
  sudoActive: boolean;
  freshLoginActive: boolean;
  isBreakGlass: boolean;
  source: "sudo" | "fresh_login" | "none" | string;
  remainingSeconds: number;
  expiresAt?: string;
  availableMethods: SudoMethod[];
  maskedEmail?: string;
}

export interface SudoVerifyResult {
  ok: boolean;
  statusCode?: number;
  elevated?: boolean;
  sudoActive?: boolean;
  isBreakGlass?: boolean;
  remainingSeconds?: number;
  expiresAt?: string;
  method?: SudoMethod | string;
  error?: string;
  message?: string;
  attemptsRemaining?: number;
  retryAfterSeconds?: number;
}

export interface SudoChallengeRequest {
  action?: string;
  reason?: string;
  isBreakGlass?: boolean;
}

export type SudoHandler = (req: SudoChallengeRequest) => Promise<boolean>;

let registeredHandler: SudoHandler | null = null;
let activeSudoPromise: Promise<boolean> | null = null;
const statusListeners = new Set<(status: SudoStatusResponse | null) => void>();

export function registerSudoHandler(handler: SudoHandler): () => void {
  registeredHandler = handler;
  return () => {
    if (registeredHandler === handler) {
      registeredHandler = null;
    }
  };
}

export function onSudoStatusChange(listener: (status: SudoStatusResponse | null) => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function emitSudoStatusChange(status: SudoStatusResponse | null): void {
  statusListeners.forEach((fn) => {
    try {
      fn(status);
    } catch {
      // Ignore listener errors
    }
  });
}

/**
 * Single-flight coordinator for Sudo Mode step-up re-authentication.
 * Concurrent API requests receiving `403 SUDO_REQUIRED` await the same modal promise.
 */
export function requestSudoElevation(req?: SudoChallengeRequest): Promise<boolean> {
  if (activeSudoPromise) {
    return activeSudoPromise;
  }
  if (!registeredHandler) {
    return Promise.resolve(false);
  }
  const handler = registeredHandler;
  activeSudoPromise = (async () => {
    try {
      return await handler(req ?? {});
    } finally {
      activeSudoPromise = null;
    }
  })();
  return activeSudoPromise;
}

export function isSudoRequiredPayload(payload: unknown): {
  isSudoRequired: boolean;
  action?: string;
  isBreakGlass?: boolean;
  message?: string;
} {
  if (!payload || typeof payload !== "object") {
    return { isSudoRequired: false };
  }
  const record = payload as Record<string, unknown>;
  const code = record.error || record.code;
  if (code === "SUDO_REQUIRED") {
    return {
      isSudoRequired: true,
      action: typeof record.action === "string" ? record.action : undefined,
      isBreakGlass: typeof record.isBreakGlass === "boolean" ? record.isBreakGlass : undefined,
      message: typeof record.message === "string" ? record.message : undefined,
    };
  }
  return { isSudoRequired: false };
}

function buildAuthHeaders(accessToken: string | null | undefined, includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return headers;
}

export async function fetchSudoStatus(accessToken: string | null | undefined): Promise<SudoStatusResponse | null> {
  try {
    const res = await fetch("/api/v1/auth/mfa/sudo/status", {
      method: "GET",
      credentials: "include",
      headers: buildAuthHeaders(accessToken, false),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as SudoStatusResponse;
    emitSudoStatusChange(data);
    return data;
  } catch {
    return null;
  }
}

export async function fetchSudoWebauthnChallenge(accessToken: string | null | undefined): Promise<{
  challenge: string;
  rpId: string;
  allowCredentials?: Array<{ type: string; id: string }>;
  timeout?: number;
  userVerification?: string;
}> {
  const res = await fetch("/api/v1/auth/mfa/sudo/webauthn/challenge", {
    method: "POST",
    credentials: "include",
    headers: buildAuthHeaders(accessToken, true),
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { message?: string; error?: string }).message || "Failed to create WebAuthn challenge");
  }
  return data as {
    challenge: string;
    rpId: string;
    allowCredentials?: Array<{ type: string; id: string }>;
    timeout?: number;
    userVerification?: string;
  };
}

export async function sendSudoEmailOtp(accessToken: string | null | undefined): Promise<{
  sent: boolean;
  maskedEmail?: string;
  cooldownSeconds?: number;
  retryAfterSeconds?: number;
  message?: string;
}> {
  const res = await fetch("/api/v1/auth/mfa/sudo/email/send", {
    method: "POST",
    credentials: "include",
    headers: buildAuthHeaders(accessToken, true),
    body: JSON.stringify({}),
  });
  const data = (await res.json().catch(() => ({}))) as {
    sent?: boolean;
    maskedEmail?: string;
    cooldownSeconds?: number;
    retryAfterSeconds?: number;
    message?: string;
  };
  return {
    sent: res.ok && Boolean(data.sent),
    maskedEmail: data.maskedEmail,
    cooldownSeconds: data.cooldownSeconds,
    retryAfterSeconds: data.retryAfterSeconds,
    message: data.message,
  };
}

export async function verifySudoChallenge(
  accessToken: string | null | undefined,
  payload: {
    method: SudoMethod;
    code?: string;
    password?: string;
    credentialId?: string;
    clientDataJSON?: string;
    authenticatorData?: string;
    signature?: string;
  }
): Promise<SudoVerifyResult> {
  const res = await fetch("/api/v1/auth/mfa/sudo/verify", {
    method: "POST",
    credentials: "include",
    headers: buildAuthHeaders(accessToken, true),
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false,
      statusCode: res.status,
      error: typeof data.error === "string" ? data.error : undefined,
      message: typeof data.message === "string" ? data.message : "Verification failed",
      attemptsRemaining: typeof data.attemptsRemaining === "number" ? data.attemptsRemaining : undefined,
      retryAfterSeconds: typeof data.retryAfterSeconds === "number" ? data.retryAfterSeconds : undefined,
    };
  }
  return {
    ok: true,
    statusCode: res.status,
    elevated: Boolean(data.elevated),
    sudoActive: Boolean(data.sudoActive),
    isBreakGlass: Boolean(data.isBreakGlass),
    remainingSeconds: typeof data.remainingSeconds === "number" ? data.remainingSeconds : 900,
    expiresAt: typeof data.expiresAt === "string" ? data.expiresAt : undefined,
    method: typeof data.method === "string" ? data.method : payload.method,
    message: typeof data.message === "string" ? data.message : undefined,
  };
}

export async function revokeSudoMode(accessToken: string | null | undefined): Promise<boolean> {
  try {
    const res = await fetch("/api/v1/auth/mfa/sudo/revoke", {
      method: "POST",
      credentials: "include",
      headers: buildAuthHeaders(accessToken, true),
      body: JSON.stringify({}),
    });
    if (!res.ok) return false;
    await fetchSudoStatus(accessToken);
    return true;
  } catch {
    return false;
  }
}
