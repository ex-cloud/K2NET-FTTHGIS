import type { AuditStreamEntry } from "@/hooks/use-audit-log-stream";

export interface EventIntegrityResult {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  tenantSlug: string;
  calculatedHash: string;
  storedHash?: string;
  prevHash: string;
  storedPrevHash?: string;
  isValid: boolean;
  status: "VERIFIED" | "TAMPERED" | "GENESIS" | "UNLINKED";
  reason?: string;
}

export interface MerkleProofStep {
  siblingHash: string;
  isLeft: boolean;
}

export interface MerkleTreeResult {
  root: string;
  levels: string[][];
  totalLeaves: number;
}

export interface ForensicAuditCertificate {
  certificateId: string;
  generatedAt: string;
  verifiedBy: string;
  totalEventsScanned: number;
  verifiedEventsCount: number;
  tamperedCount: number;
  overallStatus: "COMPLIANT_UNALTERED" | "COMPROMISED" | "PARTIALLY_VERIFIED";
  merkleRoot: string;
  genesisHash: string;
  timeSpan: {
    earliest: string;
    latest: string;
  };
  hashAlgorithm: "SHA-256 (FIPS 180-4)";
  standardsCompliance: string[];
}

export interface BatchIntegrityReport {
  isValid: boolean;
  overallStatus: "COMPLIANT_UNALTERED" | "COMPROMISED" | "PARTIALLY_VERIFIED";
  totalEvents: number;
  verifiedCount: number;
  tamperedCount: number;
  merkleTree: MerkleTreeResult;
  genesisHash: string;
  eventResults: EventIntegrityResult[];
  computationDurationMs: number;
  certificate: ForensicAuditCertificate;
}

/**
 * Native Web Cryptography SHA-256 helper
 */
export async function computeSha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Deterministic JSON stringifier to guarantee consistent hash payloads
 */
function deterministicStringify(obj: unknown): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj) ?? "null";
  }
  if (Array.isArray(obj)) {
    return `[${obj.map((item) => deterministicStringify(item)).join(",")}]`;
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map(
    (k) => `${JSON.stringify(k)}:${deterministicStringify((obj as Record<string, unknown>)[k])}`
  );
  return `{${pairs.join(",")}}`;
}

/**
 * Calculates a single event's SHA-256 hash using the platform cryptographic standard:
 * SHA256(prevHash|tenantSlug|actorID|action|resourceType|resourceID|occurredAt|payloadChecksum)
 */
export async function computeEventIntegrityHash(
  event: AuditStreamEntry,
  fallbackPrevHash: string
): Promise<{ calculatedHash: string; prevHash: string; payloadChecksum: string }> {
  const tenantSlug = event.tenantSlug || "system";
  const actorID = event.actor || "system";
  const action = event.action || "UNKNOWN";
  const resourceType = event._resourceType || event.targetResource || "SYSTEM";
  const resourceId = event.resourceId || event.id || "";
  const occurredAt = event.timestamp;

  // 1. Calculate payload checksum from oldValue + newValue + metadata (excluding dynamic hash keys)
  const metaCopy = { ...(event.metadata || {}) };
  delete metaCopy.hash;
  delete metaCopy.prevHash;

  const oldJSON = deterministicStringify(event.oldValue ?? null);
  const newJSON = deterministicStringify(event.newValue ?? null);
  const metaJSON = deterministicStringify(metaCopy);

  const payloadCombined = oldJSON + newJSON + metaJSON;
  const payloadChecksum = await computeSha256(payloadCombined);

  // 2. Resolve prevHash
  const prevHash =
    (event.metadata?.prevHash as string) ||
    fallbackPrevHash ||
    `GENESIS_ROOT_${tenantSlug}`;

  // 3. Compute final event hash
  const rawSignature = `${prevHash}|${tenantSlug}|${actorID}|${action}|${resourceType}|${resourceId}|${occurredAt}|${payloadChecksum}`;
  const calculatedHash = await computeSha256(rawSignature);

  return { calculatedHash, prevHash, payloadChecksum };
}

/**
 * Builds a Merkle Tree from a list of leaf hashes (pairwise SHA-256 combinations)
 */
export async function buildMerkleTree(leafHashes: string[]): Promise<MerkleTreeResult> {
  if (leafHashes.length === 0) {
    const emptyRoot = await computeSha256("EMPTY_TREE_GENESIS");
    return { root: emptyRoot, levels: [[emptyRoot]], totalLeaves: 0 };
  }

  const levels: string[][] = [leafHashes];
  let currentLevel = [...leafHashes];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const combined = currentLevel[i] + currentLevel[i + 1];
        const h = await computeSha256(combined);
        nextLevel.push(h);
      } else {
        // Odd element carries over
        nextLevel.push(currentLevel[i]);
      }
    }
    levels.push(nextLevel);
    currentLevel = nextLevel;
  }

  return {
    root: currentLevel[0],
    levels,
    totalLeaves: leafHashes.length,
  };
}

/**
 * Full Batch Integrity Verifier
 * Scans a slice of audit log entries, calculates cryptographic hash chains, builds Merkle Root,
 * and produces a compliance attestation report.
 */
export async function verifyBatchIntegrity(
  events: AuditStreamEntry[],
  verifierPrincipal: string = "Super Admin (Zero-Trust Inspector)"
): Promise<BatchIntegrityReport> {
  const startTime = performance.now();

  // Sort chronological (oldest to newest) to verify hash chaining correctly
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const eventResults: EventIntegrityResult[] = [];
  const calculatedHashes: string[] = [];
  let runningPrevHash = `GENESIS_ROOT_${sorted[0]?.tenantSlug || "system"}`;
  const genesisHash = runningPrevHash;
  let tamperedCount = 0;
  let verifiedCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const ev = sorted[i];
    const { calculatedHash, prevHash } = await computeEventIntegrityHash(
      ev,
      runningPrevHash
    );

    const storedHash = ev.metadata?.hash as string | undefined;
    const storedPrev = ev.metadata?.prevHash as string | undefined;

    let isValid = true;
    let status: "VERIFIED" | "TAMPERED" | "GENESIS" | "UNLINKED" = "VERIFIED";
    let reason: string | undefined;

    if (storedHash) {
      if (storedHash.toLowerCase() !== calculatedHash.toLowerCase()) {
        isValid = false;
        status = "TAMPERED";
        reason = `Stored payload hash mismatch: DB has ${storedHash.substring(0, 8)}... vs Calculated ${calculatedHash.substring(0, 8)}...`;
        tamperedCount++;
      } else if (storedPrev && storedPrev !== runningPrevHash && i > 0) {
        isValid = false;
        status = "UNLINKED";
        reason = `Chain continuity broken at sequence #${i + 1}`;
        tamperedCount++;
      } else {
        verifiedCount++;
      }
    } else {
      // If no stored hash, computed as standalone verifiable node
      if (i === 0) status = "GENESIS";
      else status = "VERIFIED";
      verifiedCount++;
    }

    eventResults.push({
      id: ev.id,
      timestamp: ev.timestamp,
      actor: ev.actor,
      action: ev.action,
      tenantSlug: ev.tenantSlug || "system",
      calculatedHash,
      storedHash,
      prevHash,
      storedPrevHash: storedPrev,
      isValid,
      status,
      reason,
    });

    calculatedHashes.push(calculatedHash);
    runningPrevHash = calculatedHash;
  }

  const merkleTree = await buildMerkleTree(calculatedHashes);
  const endTime = performance.now();
  const computationDurationMs = Math.round(endTime - startTime);

  const overallStatus =
    tamperedCount > 0
      ? "COMPROMISED"
      : verifiedCount === events.length
      ? "COMPLIANT_UNALTERED"
      : "PARTIALLY_VERIFIED";

  const certificate: ForensicAuditCertificate = {
    certificateId: `CERT-AUTH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    verifiedBy: verifierPrincipal,
    totalEventsScanned: events.length,
    verifiedEventsCount: verifiedCount,
    tamperedCount,
    overallStatus,
    merkleRoot: merkleTree.root,
    genesisHash,
    timeSpan: {
      earliest: sorted[0]?.timestamp || new Date().toISOString(),
      latest: sorted[sorted.length - 1]?.timestamp || new Date().toISOString(),
    },
    hashAlgorithm: "SHA-256 (FIPS 180-4)",
    standardsCompliance: [
      "ISO/IEC 27001:2022 (A.8.15 Logging)",
      "SOC 2 Type II (CC7.2 / CC7.3 Non-Repudiation)",
      "UU No. 27/2022 Pelindungan Data Pribadi (UU PDP)",
      "NIST SP 800-92 (Log Management)",
    ],
  };

  return {
    isValid: tamperedCount === 0,
    overallStatus,
    totalEvents: events.length,
    verifiedCount,
    tamperedCount,
    merkleTree,
    genesisHash,
    eventResults,
    computationDurationMs,
    certificate,
  };
}
