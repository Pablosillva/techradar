import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  description?: string;
  breadcrumb?: { label: string; href: string }[];
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-10">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Trilha de navegação" className="mb-5 text-xs text-subtle">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-brand">
                Início
              </Link>
            </li>
            {breadcrumb.map((item) => (
              <li key={item.href} className="flex items-center gap-1.5">
                <span aria-hidden="true">/</span>
                <Link href={item.href} className="hover:text-brand">
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {eyebrow && (
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brand">
          {eyebrow}
        </p>
      )}

      <h1 className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
        {title}
      </h1>

      {description && (
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted">
          {description}
        </p>
      )}

      {children}
    </header>
  );
}
