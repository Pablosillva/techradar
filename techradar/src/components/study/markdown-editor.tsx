"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Copy, FileText } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(true);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
        >
          {showPreview ? (
            <>
              <FileText className="w-3 h-3" /> Texto
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Preview
            </>
          )}
        </button>
      </div>

      <div className="flex-1 min-h-[400px]">
        {showPreview ? (
          <div className="h-full prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || placeholder || ""}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full h-full p-4 font-mono text-sm text-gray-300 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}
