"use client";

import Editor from "@monaco-editor/react";
import { useState } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export function CodeEditor({ value, onChange, language = "typescript" }: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);

  if (!mounted) {
    // Evita hidratação com Monaco (só no client)
    return <div className="h-[55vh] w-full rounded-md border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900" />;
  }

  return (
    <Editor
      height="55vh"
      defaultLanguage={language}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      options={{ minimap: { enabled: false }, fontSize: 14 }}
    />
  );
}
