"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className = "" }: MarkdownProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none text-foreground/85 leading-relaxed text-sm whitespace-pre-wrap ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
