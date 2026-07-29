import { NextRequest, NextResponse } from "next/server";

// ─── Security: Script Whitelist ────────────────────────────────────────────────
// CRITICAL: NEVER add IaC scripts here (deploy.sh, kong-setup.sh, etc.)
// These must only be triggered via SSH / GitHub Actions CI/CD pipeline.
const ALLOWED_SCRIPT_KEYS = new Set([
  "backup",          // backup.sh         — PostgreSQL + Keycloak DB dump
  "backup-minio",    // backup-minio.sh   — MinIO object storage archive
  "backup-code",     // backup-code.sh    — Codebase archive (no target/node_modules)
  "backup-docker",   // backup-docker-volumes.sh — Grafana, Prometheus, Keycloak volumes
  "backup-secrets",  // backup-secrets.sh — .env & credential files
  "archive-audit",   // archive-audit-logs.sh — Compress & rotate audit logs
  "sync-nextcloud",  // sync-nextcloud.sh — Offsite DR sync via rclone WebDAV
  "cleanup",         // cleanup.sh        — Disk cleanup, dangling docker images
]);

export interface TriggerPayload {
  scriptKey: string;
  triggeredBy?: string; // actor (user email or "system-api")
  triggeredAt?: string; // ISO timestamp
  jobId?: string;       // correlation ID
}

export async function POST(req: NextRequest) {
  let body: { scriptKey?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { scriptKey } = body;

  // ── Validate scriptKey presence ──────────────────────────────────────────────
  if (!scriptKey || typeof scriptKey !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid 'scriptKey' field" },
      { status: 400 }
    );
  }

  // ── Security: Whitelist enforcement ──────────────────────────────────────────
  if (!ALLOWED_SCRIPT_KEYS.has(scriptKey)) {
    console.warn(
      `[scheduler/trigger] BLOCKED: scriptKey "${scriptKey}" is not in whitelist.`
    );
    return NextResponse.json(
      {
        error: "Script not permitted",
        detail: "Only operational maintenance scripts may be triggered from the UI.",
      },
      { status: 403 }
    );
  }

  // ── Build job payload ─────────────────────────────────────────────────────────
  const jobId = `job-${crypto.randomUUID().slice(0, 10)}`;
  const triggeredAt = new Date().toISOString();

  const payload: TriggerPayload = {
    scriptKey,
    triggeredBy: "system-api", // TODO: replace with session user email when auth header is wired
    triggeredAt,
    jobId,
  };

  // ── Enqueue to Redis (async — does NOT exec bash directly) ────────────────────
  // Production: redis.lpush("scheduler:manual-queue", JSON.stringify(payload))
  // Background Go worker reads from this queue and executes the script.
  // For now: log intent and return 202 Accepted (mock mode).
  console.info(
    `[scheduler/trigger] Queued: scriptKey="${scriptKey}" jobId="${jobId}" at=${triggeredAt}`
  );

  // In production with Redis:
  // try {
  //   const redis = await getRedisClient();
  //   await redis.lpush("scheduler:manual-queue", JSON.stringify(payload));
  // } catch (err) {
  //   console.error("[scheduler/trigger] Redis enqueue failed:", err);
  //   return NextResponse.json({ error: "Queue unavailable" }, { status: 503 });
  // }

  return NextResponse.json(
    {
      queued: true,
      jobId,
      scriptKey,
      triggeredAt,
      message: `Job "${scriptKey}" queued for async execution. Monitor output at /logs?filter=log_type:eq:scheduler`,
    },
    { status: 202 }
  );
}

// Reject all other methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
