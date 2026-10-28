"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Check, Copy, Upload } from "lucide-react";
import { cn, copyToClipboard } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Layout                                                                    */
/* -------------------------------------------------------------------------- */

export function ToolPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TwoColumns({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-2", className)}>{children}</div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Form controls                                                             */
/* -------------------------------------------------------------------------- */

const controlClass =
  "w-full rounded-lg border border-line bg-bg-elevated px-3 py-2.5 text-sm text-fg " +
  "placeholder:text-subtle transition-colors focus:border-brand focus:outline-none " +
  "disabled:opacity-50";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-subtle">{hint}</span> : null}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

/**
 * Numeric input that still accepts a typed decimal comma ("1.234,56"), which is
 * the norm in pt-BR. `onValueChange` receives a parsed number.
 */
export function NumberInput({
  value,
  onValueChange,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number | "";
  onValueChange: (value: number | "") => void;
}) {
  function handle(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onValueChange("");
      return;
    }
    // Accept both "1234.56" and "1.234,56"; ignore anything else.
    const normalized = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    onValueChange(Number.isFinite(parsed) ? parsed : raw === "-" ? "" : Number.NaN);
  }

  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      className={cn(controlClass, "tabular-nums", className)}
      value={value === "" || Number.isNaN(value) ? "" : value}
      onChange={handle}
    />
  );
}

export function TextArea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(controlClass, "resize-y font-mono leading-relaxed", className)}
      spellCheck={false}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 shrink-0 cursor-pointer accent-[var(--brand)]"
      />
      <label htmlFor={id} className="cursor-pointer text-sm text-muted select-none">
        {label}
      </label>
    </div>
  );
}

export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-semibold text-muted">{label}</span>
        <span className="font-mono text-xs font-bold text-brand tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full cursor-pointer accent-[var(--brand)]"
      />
    </div>
  );
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

/* -------------------------------------------------------------------------- */
/*  Feedback                                                                  */
/* -------------------------------------------------------------------------- */

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "success" | "warning";
  children: ReactNode;
}) {
  const tones = {
    info: "border-brand/30 bg-brand/10 text-brand",
    error: "border-danger/30 bg-danger/10 text-danger",
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
  } as const;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm leading-relaxed",
        tones[tone],
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-sm text-subtle">
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*  Copy / download                                                           */
/* -------------------------------------------------------------------------- */

/** Button that copies `value` and briefly confirms with a checkmark. */
export function CopyButton({
  value,
  label = "Copiar",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handle = useCallback(async () => {
    const ok = await copyToClipboard(value);
    if (!ok) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }, [value]);

  return (
    <button
      type="button"
      onClick={handle}
      disabled={!value}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-strong disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" aria-hidden="true" />
      )}
      {copied ? "Copiado!" : label}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Image dropzone                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Click-or-drop file picker. Drag events are tracked with a ref counter so that
 * dragging over a child element doesn't flicker the highlight.
 */
export function Dropzone({
  onFiles,
  accept = "image/*",
  multiple = false,
  children,
}: {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  children?: ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) setDragging(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : files.slice(0, 1));
      }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Selecionar imagem"
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        dragging
          ? "border-brand bg-brand/10"
          : "border-line hover:border-brand/50 hover:bg-surface-2",
      )}
    >
      <Upload className="size-7 text-muted" aria-hidden="true" />
      {children ?? (
        <>
          <span className="text-sm font-semibold text-fg">
            Arraste uma imagem ou clique para escolher
          </span>
          <span className="text-xs text-subtle">
            Processada no seu navegador — nada é enviado.
          </span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(multiple ? files : files.slice(0, 1));
          // Reset so selecting the same file twice still fires a change event.
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Small label shown above tool output areas. */
export function ResultLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-semibold text-muted">{children}</span>
  );
}
