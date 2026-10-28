import type { MDXComponents } from "mdx/types";
import Link from "next/link";

/**
 * Global MDX component overrides. Anything listed here replaces the plain HTML
 * element that markdown would otherwise render.
 */

function HeadingLink({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!id) return <>{children}</>;
  return (
    <a
      href={`#${id}`}
      className="no-underline transition-colors hover:text-brand"
      aria-label="Link para esta seção"
    >
      {children}
    </a>
  );
}

const components: MDXComponents = {
  h1: ({ children, ...props }) => (
    <h1
      className="mt-2 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl"
      {...props}
    >
      <HeadingLink id={props.id}>{children}</HeadingLink>
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="mt-12 border-b border-line pb-2 text-2xl font-bold tracking-tight text-fg"
      {...props}
    >
      <HeadingLink id={props.id}>{children}</HeadingLink>
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-8 text-xl font-bold text-fg" {...props}>
      <HeadingLink id={props.id}>{children}</HeadingLink>
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mt-6 text-base font-bold text-fg" {...props}>
      <HeadingLink id={props.id}>{children}</HeadingLink>
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="my-4 leading-7 text-muted" {...props}>
      {children}
    </p>
  ),
  a: ({ href = "", children, ...props }) => {
    // Internal links go through next/link; external ones open in a new tab and
    // get rel="noopener noreferrer" so the target can't reach back via window.
    if (href.startsWith("/")) {
      return (
        <Link href={href} className="font-medium text-brand hover:underline" {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className="font-medium text-brand hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
  ul: ({ children, ...props }) => (
    <ul className="my-4 list-disc space-y-2 pl-6 text-muted marker:text-brand" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-4 list-decimal space-y-2 pl-6 text-muted marker:text-brand" {...props}>
      {children}
    </ol>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-6 rounded-r-lg border-l-4 border-brand bg-surface-2 py-3 pl-5 pr-4 text-muted [&>p]:my-0"
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="my-10 border-line" {...props} />,
  table: ({ children, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border-b border-line bg-surface-2 px-4 py-2.5 text-left font-bold text-fg"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border-b border-line px-4 py-2.5 text-muted" {...props}>
      {children}
    </td>
  ),
  code: ({ children, ...props }) => (
    <code
      className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-fg"
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="my-6 overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 font-mono text-sm leading-relaxed text-fg"
      {...props}
    >
      {children}
    </pre>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-bold text-fg" {...props}>
      {children}
    </strong>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
