"use client";

import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Smile,
  Paperclip,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { httpClient } from "@/lib/httpClient";
import { getBackendBaseUrl } from "@/lib/api-config";
import { type TaskComment } from "@/hooks/useTasksQuery";

interface TaskCommentsSectionProps {
  taskId: string;
  comments: TaskComment[];
  onCommentAdded?: (comment: TaskComment) => void;
}

function CommentItem({ comment }: { comment: TaskComment }) {
  const initials = comment.authorId
    ? comment.authorId.substring(0, 2).toUpperCase()
    : "AN";
  const timeAgo = (() => {
    const diff = Date.now() - new Date(comment.createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-foreground">{comment.authorId?.split("@")[0] ?? "User"}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        <div className="text-sm text-foreground/85 bg-card border border-border/50 rounded-xl px-3.5 py-2.5 whitespace-pre-wrap leading-relaxed">
          {comment.content}
        </div>
      </div>
    </div>
  );
}

export function TaskCommentsSection({
  taskId,
  comments,
  onCommentAdded,
}: TaskCommentsSectionProps) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const handleAddComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const baseUrl = getBackendBaseUrl();
      const res = await httpClient(`${baseUrl}/tasks/${taskId}/comments`, {
        method: "POST",
        token: session?.accessToken ?? "",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved: TaskComment = await res.json();
      if (onCommentAdded) onCommentAdded(saved);
      setNewComment("");
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      toast.success("Komentar terkirim");
    } catch {
      toast.error("Gagal mengirim komentar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsUploadingFile(true);
    toast.info("Mengunggah berkas via MinIO storage-gateway...");
    try {
      const { uploadTaskAttachment } = await import("@/lib/storage-client");
      const res = await uploadTaskAttachment(file, session?.accessToken);
      if (res.url) {
        const isImg = file.type.startsWith("image/");
        const markdown = isImg ? `\n\n![${file.name}](${res.url})` : `\n\n[📎 ${file.name}](${res.url})`;
        setNewComment((prev) => prev + markdown);
        toast.success(`Berkas ${file.name} berhasil diunggah ke MinIO S3`);
      }
    } catch (err: any) {
      toast.error("Gagal mengunggah berkas: " + (err.message ?? "Storage error"));
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Activity & Comments
        </h3>
        <span className="text-[10px] text-muted-foreground">{comments.length} comments</span>
      </div>

      {/* Comments timeline */}
      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 text-center py-3 bg-muted/20 border border-dashed border-border/60 rounded-xl">
          Belum ada komentar. Tulis komentar atau lampirkan berkas di bawah.
        </p>
      ) : (
        <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar-thin">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}
          <div ref={commentsEndRef} />
        </div>
      )}

      {/* Comment input box */}
      <div className="border border-border/60 rounded-xl overflow-hidden bg-card/30 focus-within:border-primary/40 transition-colors">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) handleAddComment();
          }}
          placeholder="Leave a comment... (Ctrl+Enter to submit)"
          rows={3}
          className="w-full px-4 pt-3 text-sm text-foreground bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/40 focus:ring-0 leading-relaxed"
        />
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-background/30">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => toast.info("Emoji picker coming soon")}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={isUploadingFile}
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
              title="Attach file (Upload via MinIO storage-gateway)"
            >
              {isUploadingFile ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddComment}
            disabled={!newComment.trim() || submitting}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm",
              newComment.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}
