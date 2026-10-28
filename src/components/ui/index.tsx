import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ToolIcon } from "@/components/ui/tool-icon";
import type { Tool } from "@/lib/tools";

/* -------------------------------------------------------------------------- */
/*  Card                                                                      */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <As
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-surface",
        className,
      )}
    >
      {children}
    </As>
  );
}

/* -------------------------------------------------------------------------- */
/*  Buttons                                                                   */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-strong shadow-[0_6px_20px_-8px_var(--brand)]",
  secondary:
    "bg-surface-2 text-fg border border-line hover:border-line-strong hover:bg-surface",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";

export function buttonClass(variant: ButtonVariant = "primary") {
  return cn(buttonBase, buttonVariants[variant]);
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button className={cn(buttonClass(variant), className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  variant = "primary",
  className,
  href,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link href={href} className={cn(buttonClass(variant), className)} {...props}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Badge                                                                     */
/* -------------------------------------------------------------------------- */

export function Badge({
  children,
  className,
  tone = "brand",
}: {
  children: ReactNode;
  className?: string;
  tone?: "brand" | "neutral" | "success" | "accent";
}) {
  const tones = {
    brand: "bg-brand/15 text-brand border-brand/25",
    accent: "bg-accent/15 text-accent border-accent/25",
    success: "bg-success/15 text-success border-success/25",
    neutral: "bg-surface-2 text-muted border-line",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section header                                                            */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  icon,
  title,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-end justify-between gap-4 border-b border-line pb-3",
        className,
      )}
    >
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-fg sm:text-xl">
        {icon}
        {title}
      </h2>
      {action ? (
        <Link
          href={action.href}
          className="shrink-0 text-sm font-semibold text-brand hover:underline"
        >
          {action.label} <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tool card                                                                 */
/* -------------------------------------------------------------------------- */

export function ToolCard({
  tool,
  className,
}: {
  tool: Tool;
  className?: string;
}) {
  return (
    <Card
      as="li"
      className={cn(
        "group relative transition-colors hover:border-brand/50 focus-within:border-brand/50",
        className,
      )}
    >
      <Link
        href={`/ferramentas/${tool.slug}`}
        className="flex items-start gap-3 p-4"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/12 text-brand transition-colors group-hover:bg-brand/20">
          <ToolIcon name={tool.icon} className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-fg">{tool.name}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
            {tool.tagline}
          </span>
        </span>
      </Link>
    </Card>
  );
}
