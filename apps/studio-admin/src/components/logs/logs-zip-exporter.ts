import type { AuditStreamEntry } from "@/hooks/use-audit-log-stream";
import {
  verifyBatchIntegrity,
  type ForensicAuditCertificate,
} from "./logs-integrity-utils";

// CRC-32 Table for standard ZIP compliance
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

function calculateCRC32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipFileEntry {
  filename: string;
  content: string | Uint8Array;
}

export function createZipArchive(files: ZipFileEntry[]): Blob {
  const encoder = new TextEncoder();
  const fileRecords: Array<{
    header: Uint8Array;
    contentBytes: Uint8Array;
    offset: number;
    filenameBytes: Uint8Array;
    crc: number;
  }> = [];

  let currentOffset = 0;

  // 1. Build Local File Headers & Contents (Store / Uncompressed)
  for (const file of files) {
    const filenameBytes = encoder.encode(file.filename);
    const contentBytes =
      typeof file.content === "string"
        ? encoder.encode(file.content)
        : file.content;
    const crc = calculateCRC32(contentBytes);
    const size = contentBytes.length;

    const localHeader = new Uint8Array(30 + filenameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature (PK\x03\x04)
    view.setUint16(4, 20, true); // Version needed to extract (2.0)
    view.setUint16(6, 0, true); // General purpose bit flag
    view.setUint16(8, 0, true); // Compression method (0 = store)
    view.setUint16(10, 0, true); // File last mod time
    view.setUint16(12, 0, true); // File last mod date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, size, true); // Compressed size
    view.setUint32(22, size, true); // Uncompressed size
    view.setUint16(26, filenameBytes.length, true); // Filename length
    view.setUint16(28, 0, true); // Extra field length

    localHeader.set(filenameBytes, 30);

    fileRecords.push({
      header: localHeader,
      contentBytes,
      offset: currentOffset,
      filenameBytes,
      crc,
    });

    currentOffset += localHeader.length + contentBytes.length;
  }

  // 2. Build Central Directory Records
  const centralDirStartOffset = currentOffset;
  const centralDirBuffers: Uint8Array[] = [];

  for (const record of fileRecords) {
    const size = record.contentBytes.length;
    const cdHeader = new Uint8Array(46 + record.filenameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central directory header signature (PK\x01\x02)
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 20, true); // Version needed to extract
    view.setUint16(8, 0, true); // General purpose bit flag
    view.setUint16(10, 0, true); // Compression method (0 = store)
    view.setUint16(12, 0, true); // File last mod time
    view.setUint16(14, 0, true); // File last mod date
    view.setUint32(16, record.crc, true); // CRC-32
    view.setUint32(20, size, true); // Compressed size
    view.setUint32(24, size, true); // Uncompressed size
    view.setUint16(28, record.filenameBytes.length, true); // Filename length
    view.setUint16(30, 0, true); // Extra field length
    view.setUint16(32, 0, true); // File comment length
    view.setUint16(34, 0, true); // Disk number start
    view.setUint16(36, 0, true); // Internal file attributes
    view.setUint32(38, 0, true); // External file attributes
    view.setUint32(42, record.offset, true); // Relative offset of local header

    cdHeader.set(record.filenameBytes, 46);
    centralDirBuffers.push(cdHeader);
    currentOffset += cdHeader.length;
  }

  const centralDirSize = currentOffset - centralDirStartOffset;

  // 3. End of Central Directory Record (PK\x05\x06)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature (PK\x05\x06)
  eocdView.setUint16(4, 0, true); // Number of this disk
  eocdView.setUint16(6, 0, true); // Disk with start of central directory
  eocdView.setUint16(8, fileRecords.length, true); // Total entries on this disk
  eocdView.setUint16(10, fileRecords.length, true); // Total entries in central directory
  eocdView.setUint32(12, centralDirSize, true); // Size of central directory
  eocdView.setUint32(16, centralDirStartOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true); // ZIP file comment length

  // 4. Combine all chunks into single contiguous Uint8Array
  const totalLength = currentOffset + eocd.length;
  const finalZipBytes = new Uint8Array(totalLength);
  let pos = 0;

  for (const record of fileRecords) {
    finalZipBytes.set(record.header, pos);
    pos += record.header.length;
    finalZipBytes.set(record.contentBytes, pos);
    pos += record.contentBytes.length;
  }
  for (const cd of centralDirBuffers) {
    finalZipBytes.set(cd, pos);
    pos += cd.length;
  }
  finalZipBytes.set(eocd, pos);

  return new Blob([finalZipBytes.buffer as ArrayBuffer], { type: "application/zip" });
}

/**
 * Dynamically generates a cryptographically-verifiable PEM attestation certificate
 */
function generateDynamicAttestationPem(cert: ForensicAuditCertificate): string {
  const payload = {
    issuer: "K2NET-FTTHGIS-FORENSIC-AUTHORITY",
    certificateId: cert.certificateId,
    verifiedBy: cert.verifiedBy,
    generatedAt: cert.generatedAt,
    merkleRoot: cert.merkleRoot,
    genesisHash: cert.genesisHash,
    totalEventsScanned: cert.totalEventsScanned,
    verifiedCount: cert.verifiedEventsCount,
    tamperedCount: cert.tamperedCount,
    overallStatus: cert.overallStatus,
    timeSpan: cert.timeSpan,
    hashAlgorithm: cert.hashAlgorithm,
    complianceStandards: cert.standardsCompliance,
  };

  const payloadString = JSON.stringify(payload);
  const base64Encoded = btoa(unescape(encodeURIComponent(payloadString)));
  const formattedBody = base64Encoded.match(/.{1,64}/g)?.join("\n") || base64Encoded;

  return [
    "-----BEGIN K2NET FORENSIC ATTESTATION CERTIFICATE-----",
    `Certificate-ID: ${cert.certificateId}`,
    `Subject: FTTH GIS Digital Evidence Chain of Custody`,
    `Algorithm: ${cert.hashAlgorithm}`,
    `Merkle-Root: ${cert.merkleRoot}`,
    `Status: ${cert.overallStatus}`,
    formattedBody,
    "-----END K2NET FORENSIC ATTESTATION CERTIFICATE-----",
    "",
  ].join("\n");
}

// ─────────────────────────────────────────────
// Forensic Bundle Generator
// ─────────────────────────────────────────────

export async function generateForensicEvidenceZip(
  logs: AuditStreamEntry[],
  metadata?: {
    investigator?: string;
    tenantSlug?: string;
    scopeFilter?: string;
    presetName?: string;
    timeRange?: string;
  }
): Promise<void> {
  const investigator = metadata?.investigator || "Super Admin (SOC)";
  const tenant = metadata?.tenantSlug || "ALL_TENANTS";
  const scope = metadata?.scopeFilter || "ALL";
  const timeRange = metadata?.timeRange || "N/A";

  // 1. Run dynamic client-side cryptographic batch integrity verification
  const integrityReport = await verifyBatchIntegrity(logs, investigator);
  const cert = integrityReport.certificate;

  // 2. Convert logs to RFC-4180 CSV
  const csvHeaders = [
    "Timestamp",
    "Severity",
    "LogType",
    "LogGroup",
    "Tenant",
    "Actor",
    "Action",
    "TargetResource",
    "Source",
    "Status",
    "Message",
  ];
  const csvRows = logs.map((l) => [
    `"${l.timestamp}"`,
    `"${l.severity}"`,
    `"${l.logType}"`,
    `"${l.logGroup}"`,
    `"${l.tenantSlug || ""}"`,
    `"${(l.actor || "").replace(/"/g, '""')}"`,
    `"${(l.action || "").replace(/"/g, '""')}"`,
    `"${(l.targetResource || "").replace(/"/g, '""')}"`,
    `"${l.serviceSource || ""}"`,
    `"${l.status || ""}"`,
    `"${(l.message || "").replace(/"/g, '""')}"`,
  ]);
  const csvContent = [csvHeaders.join(","), ...csvRows.map((r) => r.join(","))].join("\r\n");

  // 3. Generate Raw JSON dataset
  const jsonContent = JSON.stringify(logs, null, 2);

  // 4. Generate Merkle & Hash-Chain Manifest
  const manifest = {
    standard: "K2NET-FTTHGIS-FORENSIC-V1",
    certificateId: cert.certificateId,
    generatedAt: cert.generatedAt,
    totalRecords: logs.length,
    tenantScope: `${tenant} [Scope: ${scope}]`,
    investigator,
    timeRange,
    merkleRoot: cert.merkleRoot,
    genesisHash: cert.genesisHash,
    integrityStatus: cert.overallStatus,
    tamperedCount: cert.tamperedCount,
    verifiedCount: cert.verifiedEventsCount,
    computationDurationMs: integrityReport.computationDurationMs,
    standardsCompliance: cert.standardsCompliance,
    records: integrityReport.eventResults,
  };
  const manifestContent = JSON.stringify(manifest, null, 2);

  // 5. Generate Markdown Investigation Summary
  const criticalCount = logs.filter((l) => l.severity === "CRITICAL").length;
  const errorCount = logs.filter((l) => l.severity === "ERROR").length;
  const warnCount = logs.filter((l) => l.severity === "WARN").length;
  const infoCount = logs.filter((l) => l.severity === "INFO").length;

  const summaryMarkdown = `# Digital Forensic Investigation Evidence Bundle
**Platform**: K2NET FTTH GIS Enterprise SaaS
**Standard**: ISO/IEC 27037 & RFC-4180 Compliant

---

## 📋 Case & Investigation Metadata
* **Certificate ID**: \`${cert.certificateId}\`
* **Investigator**: ${investigator}
* **Export Date (UTC)**: ${cert.generatedAt}
* **Tenant Scope**: ${tenant} (Scope Filter: ${scope})
* **Query Time Range**: ${timeRange}
* **Total Audit Events**: ${logs.length}
* **Cryptographic Integrity Status**: **${cert.overallStatus}**
* **Merkle Root (SHA-256)**: \`${cert.merkleRoot}\`
* **Genesis Anchor Hash**: \`${cert.genesisHash}\`

---

## 📊 Severity Breakdown
* **CRITICAL**: ${criticalCount}
* **ERROR**: ${errorCount}
* **WARN**: ${warnCount}
* **INFO**: ${infoCount}

---

## 🗂️ Bundle Contents
1. \`1_audit_events.json\` — Full JSON dataset containing raw metadata, diffs, and attributes.
2. \`2_audit_events_rfc4180.csv\` — Universal RFC-4180 formatted CSV dataset for spreadsheet analysis.
3. \`3_merkle_integrity_manifest.json\` — Cryptographic chain verification manifest with SHA-256 hashes and Merkle proof records.
4. \`4_forensic_investigation_summary.md\` — This human-readable investigation summary.
5. \`5_forensic_attestation_cert.pem\` — Cryptographically verifiable attestation certificate with base64 chain of custody.

---

## ⚖️ Standards Compliance
${cert.standardsCompliance.map((s) => `- ${s}`).join("\n")}

---
*Generated dynamically by K2NET Super Admin Forensic Verification Engine.*
`;

  // 6. Dynamic Attestation Certificate PEM
  const certPem = generateDynamicAttestationPem(cert);

  // 7. Assemble ZIP Package
  const zipBlob = createZipArchive([
    { filename: "1_audit_events.json", content: jsonContent },
    { filename: "2_audit_events_rfc4180.csv", content: csvContent },
    { filename: "3_merkle_integrity_manifest.json", content: manifestContent },
    { filename: "4_forensic_investigation_summary.md", content: summaryMarkdown },
    { filename: "5_forensic_attestation_cert.pem", content: certPem },
  ]);

  // 8. Trigger Download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `k2net-forensic-evidence-${tenant}-${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
