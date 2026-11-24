import { useCallback, useEffect, useRef, useState } from "react";
import { base64UrlToBuffer, bufferToBase64Url } from "../account/passkey-register-modal";
import { saveAccountProfile, setPendingSaveProfile } from "./saved-profiles";

export interface DiscoverablePasskeyChallengeData {
  challengeId: string;
  challenge: string;
  rpId: string;
  allowCredentials?: Array<{ type: string; id: string }>;
  timeout?: number;
  userVerification?: string;
}

export interface DiscoverablePasskeyAssertionPayload {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle?: string;
}

let activeConditionalAbortController: AbortController | null = null;

/**
 * Synchronously aborts any pending background WebAuthn Conditional UI request
 * so that an explicit modal passkey prompt or form submission never collides
 * with `DOMException: A request is already pending`.
 */
export function abortPendingConditionalPasskey(): void {
  if (activeConditionalAbortController) {
    try {
      activeConditionalAbortController.abort();
    } catch {
      // Ignore abort errors
    }
    activeConditionalAbortController = null;
  }
}

/**
 * Checks whether the current browser supports WebAuthn Level 3 Conditional Mediation (Autofill).
 */
export async function isConditionalPasskeyAvailable(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    typeof window.PublicKeyCredential === "undefined" ||
    typeof window.PublicKeyCredential.isConditionalMediationAvailable !== "function"
  ) {
    return false;
  }
  try {
    return await window.PublicKeyCredential.isConditionalMediationAvailable();
  } catch {
    return false;
  }
}

/**
 * Invokes `navigator.credentials.get()` for either explicit modal Passkey login
 * or background WebAuthn Conditional UI (`mediation: "conditional"`).
 */
export async function requestDiscoverablePasskeyAssertion(
  challengeData: DiscoverablePasskeyChallengeData,
  options?: {
    conditional?: boolean;
    signal?: AbortSignal;
  }
): Promise<DiscoverablePasskeyAssertionPayload> {
  const isConditional = Boolean(options?.conditional);
  const challengeBuffer = base64UrlToBuffer(challengeData.challenge);

  const allowCreds: PublicKeyCredentialDescriptor[] = isConditional
    ? []
    : (challengeData.allowCredentials || []).map((c) => ({
        type: "public-key" as const,
        id: base64UrlToBuffer(c.id) as unknown as BufferSource,
      }));

  const credentialGetOptions: CredentialRequestOptions = {
    publicKey: {
      challenge: challengeBuffer as unknown as BufferSource,
      rpId: challengeData.rpId,
      allowCredentials: allowCreds,
      userVerification: (challengeData.userVerification as UserVerificationRequirement) || "preferred",
      timeout: challengeData.timeout || 60000,
    },
    signal: options?.signal,
  };

  if (isConditional) {
    (credentialGetOptions as CredentialRequestOptions & { mediation?: string }).mediation =
      "conditional";
  }

  const assertion = (await navigator.credentials.get(
    credentialGetOptions
  )) as PublicKeyCredential | null;

  if (!assertion) {
    throw new Error("No assertion returned by authenticator");
  }

  const resp = assertion.response as AuthenticatorAssertionResponse;
  return {
    credentialId: bufferToBase64Url(assertion.rawId),
    clientDataJSON: bufferToBase64Url(resp.clientDataJSON),
    authenticatorData: bufferToBase64Url(resp.authenticatorData),
    signature: bufferToBase64Url(resp.signature),
    userHandle: resp.userHandle ? bufferToBase64Url(resp.userHandle) : undefined,
  };
}

export interface UseWebauthnConditionalUIOptions<TUser> {
  enabled: boolean;
  plane: "PLATFORM" | "TENANT";
  tenantSlug?: string;
  getChallenge?: (input: {
    plane: "PLATFORM" | "TENANT";
    tenantSlug?: string;
    conditional: boolean;
  }) => Promise<DiscoverablePasskeyChallengeData>;
  verifyLogin?: (input: {
    challengeId: string;
    credentialId: string;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
    plane: "PLATFORM" | "TENANT";
    tenantSlug?: string;
    rememberMe?: boolean;
  }) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
    user?: TUser;
  }>;
  onBeginVerify?: () => void;
  onEndVerify?: () => void;
  onSuccess: (user?: TUser) => void;
  onError: (error?: string, message?: string) => void;
}

/**
 * Manages the background WebAuthn Level 3 Conditional UI (`mediation: "conditional"`)
 * lifecycle with automatic AbortController cleanup and safe re-arming.
 */
export function useWebauthnConditionalUI<TUser>(
  options: UseWebauthnConditionalUIOptions<TUser>
) {
  const {
    enabled,
    plane,
    tenantSlug,
    getChallenge,
    verifyLogin,
    onBeginVerify,
    onEndVerify,
    onSuccess,
    onError,
  } = options;

  const [restartTick, setRestartTick] = useState(0);
  const callbacksRef = useRef({
    onBeginVerify,
    onEndVerify,
    onSuccess,
    onError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onBeginVerify,
      onEndVerify,
      onSuccess,
      onError,
    };
  }, [onBeginVerify, onEndVerify, onSuccess, onError]);

  const restartConditionalUI = useCallback(() => {
    setRestartTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !getChallenge || !verifyLogin) {
      abortPendingConditionalPasskey();
      return;
    }

    let unmounted = false;
    const controller = new AbortController();

    const startConditionalMediation = async () => {
      const supported = await isConditionalPasskeyAvailable();
      if (!supported || unmounted || controller.signal.aborted) {
        return;
      }

      abortPendingConditionalPasskey();
      activeConditionalAbortController = controller;

      try {
        const challengeData = await getChallenge({
          plane,
          tenantSlug,
          conditional: true,
        });
        if (unmounted || controller.signal.aborted) {
          return;
        }

        const assertion = await requestDiscoverablePasskeyAssertion(challengeData, {
          conditional: true,
          signal: controller.signal,
        });
        if (unmounted || controller.signal.aborted) {
          return;
        }

        callbacksRef.current.onBeginVerify?.();
        const result = await verifyLogin({
          challengeId: challengeData.challengeId,
          ...assertion,
          plane,
          tenantSlug,
          rememberMe: true,
        });

        if (unmounted) return;

        if (result.success) {
          callbacksRef.current.onSuccess(result.user);
        } else {
          callbacksRef.current.onError(result.error || "PASSKEY_AUTH_FAILED", result.message);
          setRestartTick((prev) => prev + 1);
        }
      } catch (err: unknown) {
        if (unmounted || controller.signal.aborted) {
          return;
        }
        if (err instanceof Error && (err.name === "AbortError" || err.name === "NotAllowedError")) {
          return;
        }
      } finally {
        if (activeConditionalAbortController === controller) {
          activeConditionalAbortController = null;
        }
        if (!unmounted) {
          callbacksRef.current.onEndVerify?.();
        }
      }
    };

    const timer = setTimeout(() => {
      void startConditionalMediation();
    }, 120);

    return () => {
      unmounted = true;
      clearTimeout(timer);
      if (activeConditionalAbortController === controller) {
        activeConditionalAbortController = null;
      }
      try {
        controller.abort();
      } catch {
        // Ignore abort errors
      }
    };
  }, [enabled, getChallenge, plane, restartTick, tenantSlug, verifyLogin]);

  return {
    restartConditionalUI,
    abortPendingConditionalPasskey,
  };
}

export interface PasskeyAuthenticatedUserLike {
  email?: string;
  username?: string;
  name?: string;
  avatarUrl?: string;
}

export interface UsePasswordlessPasskeyFlowOptions<TUser extends PasskeyAuthenticatedUserLike> {
  enabled: boolean;
  plane: "PLATFORM" | "TENANT";
  tenantSlug?: string;
  getChallenge?: (input?: {
    plane?: "PLATFORM" | "TENANT";
    tenantSlug?: string;
    username?: string;
    conditional?: boolean;
  }) => Promise<DiscoverablePasskeyChallengeData>;
  verifyLogin?: (input: {
    challengeId: string;
    credentialId: string;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
    plane?: "PLATFORM" | "TENANT";
    tenantSlug?: string;
    rememberMe?: boolean;
  }) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
    user?: TUser;
  }>;
  onSuccess: (user?: TUser) => void;
  onError: (errorCode: string, rawMessage?: string) => void;
  onClearError?: () => void;
  unsupportedMessage: string;
  cancelledMessage: string;
}

/**
 * Unified hook combining background WebAuthn Conditional UI (`mediation: "conditional"`)
 * and explicit 0-Click Passwordless Passkey button authentication with zero race conditions.
 */
export function usePasswordlessPasskeyFlow<TUser extends PasskeyAuthenticatedUserLike>(
  options: UsePasswordlessPasskeyFlowOptions<TUser>
) {
  const {
    enabled,
    plane,
    tenantSlug,
    getChallenge,
    verifyLogin,
    onSuccess,
    onError,
    onClearError,
    unsupportedMessage,
    cancelledMessage,
  } = options;

  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  const persistPasskeyProfileAndComplete = useCallback(
    (user?: TUser, fallbackEmail?: string) => {
      const resolvedEmail = user?.email || user?.username || fallbackEmail;
      if (resolvedEmail) {
        setPendingSaveProfile({
          email: resolvedEmail,
          username: user?.username || resolvedEmail,
          displayName: user?.name,
          tenantSlug,
          authMethod: "passkey",
          shouldSave: true,
        });
        saveAccountProfile({
          email: resolvedEmail,
          username: user?.username || resolvedEmail,
          displayName: user?.name,
          avatarUrl: user?.avatarUrl,
          tenantSlug,
          authMethod: "passkey",
        });
      }
      onSuccess(user);
    },
    [onSuccess, tenantSlug]
  );

  const { restartConditionalUI } = useWebauthnConditionalUI<TUser>({
    enabled: enabled && !isPasskeyLoading,
    plane,
    tenantSlug,
    getChallenge: getChallenge
      ? (input) =>
          getChallenge({
            plane: input.plane,
            tenantSlug: input.tenantSlug,
            conditional: input.conditional,
          })
      : undefined,
    verifyLogin: verifyLogin
      ? (input) =>
          verifyLogin({
            ...input,
            plane: input.plane,
            tenantSlug: input.tenantSlug,
          })
      : undefined,
    onBeginVerify: () => {
      setIsPasskeyLoading(true);
      onClearError?.();
    },
    onEndVerify: () => {
      setIsPasskeyLoading(false);
    },
    onSuccess: (user) => {
      persistPasskeyProfileAndComplete(user);
    },
    onError: (errCode, rawMsg) => {
      onError(errCode || "PASSKEY_AUTH_FAILED", rawMsg);
    },
  });

  const handlePasswordlessPasskeyLogin = useCallback(
    async (usernameHint?: string): Promise<boolean> => {
      if (!getChallenge || !verifyLogin) return false;
      if (typeof window === "undefined" || !window.PublicKeyCredential) {
        onError("PASSKEY_UNSUPPORTED", unsupportedMessage);
        return false;
      }

      // 1. Immediately abort any pending background Conditional UI request to prevent DOMException collision
      abortPendingConditionalPasskey();
      setIsPasskeyLoading(true);
      onClearError?.();

      try {
        // Yield a microtask so browser cleans up the aborted conditional request
        await Promise.resolve();

        const challengeData = await getChallenge({
          plane,
          tenantSlug,
          username: usernameHint?.trim() || undefined,
          conditional: false,
        });

        const assertion = await requestDiscoverablePasskeyAssertion(challengeData, {
          conditional: false,
        });

        const result = await verifyLogin({
          challengeId: challengeData.challengeId,
          ...assertion,
          plane,
          tenantSlug,
          rememberMe: true,
        });

        if (result.success) {
          persistPasskeyProfileAndComplete(result.user, usernameHint);
          return true;
        }

        onError(result.error || "PASSKEY_AUTH_FAILED", result.message);
        restartConditionalUI();
        return false;
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === "NotAllowedError" || err.name === "AbortError")) {
          onError("PASSKEY_CANCELLED", cancelledMessage);
        } else {
          onError(
            "PASSKEY_AUTH_FAILED",
            err instanceof Error ? err.message : undefined
          );
        }
        restartConditionalUI();
        return false;
      } finally {
        setIsPasskeyLoading(false);
      }
    },
    [
      cancelledMessage,
      getChallenge,
      onClearError,
      onError,
      persistPasskeyProfileAndComplete,
      plane,
      restartConditionalUI,
      tenantSlug,
      unsupportedMessage,
      verifyLogin,
    ]
  );

  return {
    isPasskeyLoading,
    handlePasswordlessPasskeyLogin,
    abortPendingConditionalPasskey,
  };
}

