"use client";

import React from "react";

const EMOJI_SET = [
  "🚀", "✅", "🐛", "💡", "📋", "🔥", "⚠️", "🔧", "📌", "🎯",
  "📊", "🗺️", "🔐", "🌐", "💬", "📎", "🎨", "⚡", "🛠️", "📱",
  "💻", "🖥️", "🗄️", "📡", "🔗", "🔍", "📝", "📈", "🏗️", "🔄",
];

interface TaskEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function TaskEmojiPicker({ onSelect, onClose }: TaskEmojiPickerProps) {
  return (
    <div className="absolute top-8 left-0 z-50 bg-card border border-border rounded-xl shadow-2xl p-3 w-56">
      <div className="grid grid-cols-8 gap-1">
        {EMOJI_SET.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => {
              onSelect(e);
              onClose();
            }}
            className="text-lg hover:bg-muted/60 rounded-md p-0.5 transition-colors"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
