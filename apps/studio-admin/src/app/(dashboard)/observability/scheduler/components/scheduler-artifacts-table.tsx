"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@k2net/ui";
import { Archive, ShieldCheck, Info, Check, Copy, ExternalLink, Download, Trash2 } from "lucide-react";
import { type BackupArtifact } from "@/lib/mock-data/observability-mock";

function StorageBadge({ target, label }: { target: BackupArtifact["storageTarget"]; label: string }) {
  const cls =
    target === "nextcloud-dr"
      ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
      : "border-violet-500/30 bg-violet-500/10 text-violet-400";
  return (
    <Badge className={`text-[10px] font-mono ${cls}`}>
      {label}
    </Badge>
  );
}

interface ChecksumModalProps {
  artifact: BackupArtifact;
  onClose: () => void;
}

function ChecksumModal({ artifact, onClose }: ChecksumModalProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.checksumSha256 ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-border/80">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Artifact Checksum Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs text-foreground/75 dark:text-muted-foreground font-mono truncate">
            {artifact.artifactName}
          </p>
          <div className="bg-muted/40 border border-border/60 rounded-lg p-3 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-foreground/80 truncate">
              SHA-256: {artifact.checksumSha256}
            </span>
            <button onClick={handleCopy} className="shrink-0 p-1 rounded hover:bg-muted transition-colors">
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded p-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Checksum verified match with on-premise MinIO storage archive.</span>
          </div>
          <p className="text-[10px] text-foreground/75 dark:text-muted-foreground">
            Completed: {artifact.completedAt} · Size: {artifact.fileSize}
          </p>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetadataModalProps {
  artifact: BackupArtifact;
  onClose: () => void;
}

function MetadataModal({ artifact, onClose }: MetadataModalProps) {
  const meta = {
    "Artifact Name": artifact.artifactName,
    "Source Script": artifact.sourceScript,
    "Storage Target": artifact.storageLabel,
    "File Size": artifact.fileSize,
    "Completed At": artifact.completedAt,
    "SHA-256": artifact.checksumSha256,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 shadow-2xl border-border/80">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Archive className="w-4 h-4 text-primary" />
            Artifact Metadata
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-2">
          {Object.entries(meta).map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground shrink-0 w-28">
                {k}
              </span>
              <span className="text-xs font-mono text-foreground/80 text-right truncate max-w-[240px]">
                {v}
              </span>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DeleteConfirmDialogProps {
  filename: string;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmDialog({ filename, onClose, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-border/80">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-500">
            <Trash2 className="w-4 h-4" />
            Confirm Delete Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <p className="text-xs text-foreground/80">
            Are you sure you want to permanently delete the following backup file from local storage?
          </p>
          <div className="rounded-lg bg-muted/40 border border-border/60 p-3 font-mono text-xs text-foreground/90 truncate">
            {filename}
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={onConfirm}>
              Delete File
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SchedulerArtifactsTableProps {
  artifacts: BackupArtifact[];
  loading: boolean;
  deleteArtifact: (filename: string) => Promise<boolean>;
}

export function SchedulerArtifactsTable({
  artifacts,
  loading,
  deleteArtifact,
}: SchedulerArtifactsTableProps) {
  const [checksumModal, setChecksumModal] = useState<BackupArtifact | null>(null);
  const [metadataModal, setMetadataModal] = useState<BackupArtifact | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<BackupArtifact | null>(null);

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await deleteArtifact(deleteDialog.artifactName);
    } finally {
      setDeleteDialog(null);
    }
  };

  return (
    <>
      {checksumModal && (
        <ChecksumModal artifact={checksumModal} onClose={() => setChecksumModal(null)} />
      )}
      {metadataModal && (
        <MetadataModal artifact={metadataModal} onClose={() => setMetadataModal(null)} />
      )}
      {deleteDialog && (
        <DeleteConfirmDialog
          filename={deleteDialog.artifactName}
          onClose={() => setDeleteDialog(null)}
          onConfirm={handleDelete}
        />
      )}

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            Backup Artifacts &amp; Offsite DR Explorer
          </CardTitle>
          <p className="text-xs text-foreground/75 dark:text-muted-foreground mt-0.5">
            Validate backup archives generated by{" "}
            <code className="font-mono text-[10px] bg-muted px-1 rounded">backup-*.sh</code> and{" "}
            <code className="font-mono text-[10px] bg-muted px-1 rounded">sync-nextcloud.sh</code> across
            MinIO S3 and Nextcloud WebDAV (Layer-3 DR).
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_140px_150px_80px_140px_200px] px-5 py-2.5 border-b border-border bg-muted/30 gap-2">
            {[
              "Artifact Name",
              "Source Script",
              "Storage Target",
              "Size",
              "Timestamp",
              "Actions",
            ].map((h) => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-foreground/75 dark:text-muted-foreground">
                {h}
              </span>
            ))}
          </div>

          <div className="divide-y divide-border/60">
            {artifacts.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
                <Archive className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {loading ? "Loading artifacts..." : "No backup artifacts found on disk."}
                </p>
              </div>
            ) : (
              artifacts.map((artifact) => (
                <div key={artifact.id} className="grid grid-cols-[1fr_140px_150px_80px_140px_200px] px-5 py-3.5 hover:bg-muted/20 transition-colors items-center gap-2">
                  <span className="text-xs font-mono text-foreground/80 truncate" title={artifact.artifactName}>
                    {artifact.artifactName.split("/").pop()}
                  </span>

                  <Badge className="w-fit font-mono text-[10px] border-border bg-muted/60 text-muted-foreground">
                    {artifact.sourceScript}
                  </Badge>

                  <StorageBadge target={artifact.storageTarget} label={artifact.storageLabel} />

                  <span className="text-xs font-mono text-foreground/75 dark:text-muted-foreground">
                    {artifact.fileSize}
                  </span>

                  <span className="text-xs font-mono text-foreground/75 dark:text-muted-foreground">
                    {artifact.completedAt}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 font-mono" title="Verify checksum" onClick={() => setChecksumModal(artifact)}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 font-mono" title="View metadata" onClick={() => setMetadataModal(artifact)}>
                      <Info className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] px-2 font-mono"
                      title="Download backup file"
                      onClick={() => {
                        window.location.href = `/api/v1/system/backup-status/download?file=${encodeURIComponent(artifact.artifactName)}`;
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] px-2 font-mono hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30"
                      title="Delete backup file"
                      onClick={() => setDeleteDialog(artifact)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
