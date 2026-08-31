"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Link as TipTapLink } from "@tiptap/extension-link";
import { Image as TipTapImage } from "@tiptap/extension-image";

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Pilcrow,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Table as TableIcon,
  Plus,
  Trash2,
  Split,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Loader2,
  FileCode,
  Edit3,
  Columns2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./dropdown-menu";
import { Badge } from "./badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
  onUploadImage?: (file: File) => Promise<{ url: string; filename?: string }>;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tulis SOP teknis, tabel konfigurasi, atau panduan operasional di sini...",
  disabled = false,
  minHeight = "320px",
  className = "",
  onUploadImage,
}: RichTextEditorProps) {
  const [viewMode, setViewMode] = useState<"visual" | "split" | "raw">("visual");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isUpdatingFromProps = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: "notion-code-block font-mono text-xs bg-muted/60 p-3 rounded-lg border border-border my-2 overflow-x-auto",
          },
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "tiptap-table border-collapse w-full my-3 rounded-lg overflow-hidden border border-border text-xs",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "bg-muted/70 font-semibold p-2 border border-border text-foreground text-left",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "p-2 border border-border text-foreground/90",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TipTapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer font-medium",
        },
      }),
      TipTapImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg max-w-full my-3 border border-border shadow-xs",
        },
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: "-",
        linkify: true,
        breaks: true,
      }),
    ],
    content: value || "",
    editable: !disabled,
    editorProps: {
      attributes: {
        class: `focus:outline-none min-h-[${minHeight}] p-4 text-xs text-foreground leading-relaxed selection:bg-primary/20`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (isUpdatingFromProps.current) return;
      try {
        const storage = ed.storage as unknown as Record<string, { getMarkdown?: () => string } | undefined>;
        const md = storage.markdown?.getMarkdown?.() || "";
        onChange(md);
      } catch {
        onChange(ed.getHTML());
      }
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor) return;
    try {
      const storage = editor.storage as unknown as Record<string, { getMarkdown?: () => string } | undefined>;
      const currentMd = storage.markdown?.getMarkdown?.() || "";
      if (value !== currentMd && !editor.isFocused) {
        isUpdatingFromProps.current = true;
        editor.commands.setContent(value || "");
        isUpdatingFromProps.current = false;
      }
    } catch {
      if (value !== editor.getHTML() && !editor.isFocused) {
        isUpdatingFromProps.current = true;
        editor.commands.setContent(value || "");
        isUpdatingFromProps.current = false;
      }
    }
  }, [value, editor]);

  // Handle Image File (MinIO S3 or base64 fallback)
  const handleImageFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      if (!file.type.startsWith("image/")) {
        return;
      }

      setIsUploadingImage(true);

      try {
        if (onUploadImage) {
          const res = await onUploadImage(file);
          if (res && res.url) {
            editor.chain().focus().setImage({ src: res.url, alt: file.name }).run();
            return;
          }
        }

        // Fallback: base64
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.warn("[RichTextEditor] Image upload fallback to base64:", err);
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingImage(false);
      }
    },
    [editor, onUploadImage]
  );

  // Link Dialog
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Masukkan URL tautan:", previousUrl || "https://");

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // Insert Table Shortcut
  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  // Drag and Drop & Paste Image Handler
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
          e.preventDefault();
          handleImageFile(file);
        }
      }
    },
    [handleImageFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith("image/")) {
          e.preventDefault();
          handleImageFile(file);
        }
      }
    },
    [handleImageFile]
  );

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const estimatedTokens = Math.round(wordCount * 1.3);

  return (
    <div
      className={`rounded-lg border border-border bg-card shadow-xs overflow-hidden flex flex-col focus-within:border-primary/60 transition-colors ${className}`}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      {/* ── Toolbar / MenuBar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-muted/40 border-b border-border/80 text-xs">
        {/* Left Side: Formatting Tools */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <div className="flex items-center bg-background rounded-md border border-border p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => editor?.chain().focus().setParagraph().run()}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                editor?.isActive("paragraph") && !editor?.isActive("heading")
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Paragraf Normal"
            >
              <Pilcrow className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`px-2 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                editor?.isActive("heading", { level: 1 })
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Heading 1 (#)"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-2 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                editor?.isActive("heading", { level: 2 })
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Heading 2 (##)"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-2 py-1 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                editor?.isActive("heading", { level: 3 })
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Heading 3 (###)"
            >
              H3
            </button>
          </div>

          <div className="w-px h-4 bg-border/80 mx-0.5" />

          {/* Inline Formats: Bold, Italic, Strike, Code */}
          <div className="flex items-center bg-background rounded-md border border-border p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-1 rounded transition-colors cursor-pointer ${
                editor?.isActive("bold")
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Tebal (**teks**)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-1 rounded transition-colors cursor-pointer ${
                editor?.isActive("italic")
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Miring (*teks*)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={`p-1 rounded transition-colors cursor-pointer ${
                editor?.isActive("strike")
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Coret (~~teks~~)"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleCode().run()}
              className={`p-1 rounded transition-colors cursor-pointer ${
                editor?.isActive("code")
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Kode Baris (`kode`)"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-border/80 mx-0.5" />

          {/* Block Elements: Lists, Quote, Code Block, HR */}
          <div className="flex items-center bg-background rounded-md border border-border p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-1 rounded transition-colors cursor-pointer ${
                editor?.isActive("bulletList")
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Daftar Bullet (- item)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-1 rounded transition-colors cursor-pointer ${
                editor?.isActive("orderedList")
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Daftar Nomor (1. item)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`p-1 rounded transition-colors cursor-pointer ${
                editor?.isActive("blockquote")
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Kutipan / Catatan (> teks)"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              className={`p-1 rounded transition-colors cursor-pointer ${
                editor?.isActive("codeBlock")
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Blok Kode (```)"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              className="p-1 rounded text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
              title="Garis Pemisah (---)"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-px h-4 bg-border/80 mx-0.5" />

          {/* Table Operations Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                  editor?.isActive("table")
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "bg-background border-border text-foreground hover:bg-muted/60"
                }`}
                title="Manajemen Tabel Markdown"
              >
                <TableIcon className="w-3.5 h-3.5 text-primary" />
                <span>Tabel</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-card border-border shadow-xl">
              <DropdownMenuLabel className="text-xs font-bold text-foreground">
                Operasi Tabel
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={insertTable} className="text-xs gap-2 cursor-pointer">
                <TableIcon className="w-3.5 h-3.5 text-primary" />
                <span>Sisipkan Tabel Baru</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem
                onClick={() => editor?.chain().focus().addColumnBefore().run()}
                disabled={!editor?.isActive("table")}
                className="text-xs gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kolom Kiri</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().addColumnAfter().run()}
                disabled={!editor?.isActive("table")}
                className="text-xs gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kolom Kanan</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().deleteColumn().run()}
                disabled={!editor?.isActive("table")}
                className="text-xs gap-2 text-destructive cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Kolom</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem
                onClick={() => editor?.chain().focus().addRowBefore().run()}
                disabled={!editor?.isActive("table")}
                className="text-xs gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Atas</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().addRowAfter().run()}
                disabled={!editor?.isActive("table")}
                className="text-xs gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Bawah</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().deleteRow().run()}
                disabled={!editor?.isActive("table")}
                className="text-xs gap-2 text-destructive cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Baris</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem
                onClick={() => editor?.chain().focus().mergeOrSplit().run()}
                disabled={!editor?.isActive("table")}
                className="text-xs gap-2 cursor-pointer"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Gabung / Pisah Sel</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor?.chain().focus().deleteTable().run()}
                disabled={!editor?.isActive("table")}
                className="text-xs gap-2 text-destructive font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Seluruh Tabel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Link & Image Upload */}
          <div className="flex items-center bg-background rounded-md border border-border p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={setLink}
              className={`p-1 rounded transition-colors cursor-pointer ${
                editor?.isActive("link")
                  ? "bg-primary/15 text-primary"
                  : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              title="Sisipkan Tautan"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
            {editor?.isActive("link") && (
              <button
                type="button"
                onClick={() => editor.chain().focus().unsetLink().run()}
                className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                title="Hapus Tautan"
              >
                <Unlink className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className="p-1 rounded text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors cursor-pointer"
              title="Unggah Gambar (atau Drag & Drop langsung)"
            >
              {isUploadingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="w-px h-4 bg-border/80 mx-0.5" />

          {/* History Undo / Redo */}
          <div className="flex items-center bg-background rounded-md border border-border p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              className="p-1 rounded text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              className="p-1 rounded text-foreground/75 dark:text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Mode Switcher (Visual / Split / Raw) */}
        <div className="flex items-center gap-1 bg-background p-0.5 rounded-md border border-border shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode("visual")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              viewMode === "visual"
                ? "bg-primary/15 text-primary font-semibold"
                : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
            title="Mode Editor Visual (WYSIWYG TipTap)"
          >
            <Edit3 className="w-3 h-3" />
            <span>Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              viewMode === "split"
                ? "bg-primary/15 text-primary font-semibold"
                : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
            title="Mode Split (Editor di Kiri & Live Markdown di Kanan)"
          >
            <Columns2 className="w-3 h-3" />
            <span>Split View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("raw")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              viewMode === "raw"
                ? "bg-primary/15 text-primary font-semibold"
                : "text-foreground/75 dark:text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
            title="Mode Teks Markdown Mentah"
          >
            <FileCode className="w-3 h-3" />
            <span>Raw MD</span>
          </button>
        </div>
      </div>

      {/* ── Editor Canvas / Workspace ────────────────────────────────────── */}
      <div className="relative flex-1 bg-background min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar">
        {viewMode === "visual" && (
          <div className="prose-container">
            <EditorContent editor={editor} />
          </div>
        )}

        {viewMode === "split" && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border h-full min-h-[320px]">
            {/* Left: TipTap Visual Editor */}
            <div className="prose-container overflow-y-auto p-1 custom-scrollbar">
              <EditorContent editor={editor} />
            </div>

            {/* Right: Real-time Markdown Rendered Preview */}
            <div className="p-4 bg-muted/10 overflow-y-auto custom-scrollbar text-xs leading-relaxed text-foreground">
              <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-foreground/75 dark:text-muted-foreground mb-3 pb-1 border-b border-border flex items-center justify-between">
                <span>Live GFM Markdown Preview</span>
                <Badge variant="outline" className="text-[9px] font-mono border-primary/30 text-primary">
                  pgvector ready
                </Badge>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/60 prose-pre:border prose-pre:border-border">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {value || "*Belum ada konten dokumen.*"}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {viewMode === "raw" && (
          <div className="p-3 h-full">
            <textarea
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                if (editor) {
                  isUpdatingFromProps.current = true;
                  editor.commands.setContent(e.target.value);
                  isUpdatingFromProps.current = false;
                }
              }}
              rows={14}
              placeholder="# Tulis format Markdown mentah di sini..."
              className="w-full h-full min-h-[300px] p-3 rounded-lg bg-muted/20 border border-border text-foreground font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary resize-y custom-scrollbar"
            />
          </div>
        )}
      </div>

      {/* ── Metadata & Token Summary Bar ─────────────────────────────────── */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border/80 flex items-center justify-between text-[11px] text-foreground/75 dark:text-muted-foreground font-mono">
        <div className="flex items-center gap-3">
          <span>
            Kata: <strong className="text-foreground">{wordCount.toLocaleString()}</strong>
          </span>
          <span>•</span>
          <span>
            Karakter: <strong className="text-foreground">{charCount.toLocaleString()}</strong>
          </span>
          <span>•</span>
          <span>
            Est. Token RAG: <strong className="text-primary font-semibold">~{estimatedTokens.toLocaleString()}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-foreground/75 dark:text-muted-foreground hidden sm:inline">
            Drag & Drop gambar didukung
          </span>
          <Badge variant="outline" className="text-[9px] font-mono border-border bg-background">
            TipTap Headless + GFM
          </Badge>
        </div>
      </div>
    </div>
  );
}
