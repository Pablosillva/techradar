import Link from "next/link";
import { SearchBox } from "@/components/search-box";

const tags = [
  "React",
  "TypeScript",
  "Python",
  "JavaScript",
  "Node.js",
  "IA",
  "Docker",
  "Linux",
  "Git",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      {/* Ambient background: a soft brand glow and a faint grid, matching the
          "código / ideias / projetos" aesthetic of the original design. */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
        aria-hidden="true"
      />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
            TechLab — aprenda, crie, evolua
          </p>

          <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-fg sm:text-4xl lg:text-[2.6rem]">
            Tudo o que você precisa para evoluir na{" "}
            <span className="text-brand">tecnologia</span>, em um só lugar.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Artigos, tutoriais, ferramentas, cursos e muito mais para você dominar
            a tecnologia, a IA e o desenvolvimento.
          </p>

          <SearchBox className="mt-6 max-w-xl" />

          <ul className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/artigos?q=${encodeURIComponent(tag)}`}
                  className="inline-block rounded-full border border-line bg-bg-elevated px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-brand/50 hover:text-fg"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative terminal panel. Purely presentational, so it is hidden
            from assistive tech. */}
        <div
          className="relative hidden items-center justify-center lg:flex"
          aria-hidden="true"
        >
          <div className="w-full max-w-sm rotate-[-2deg] rounded-2xl border border-line bg-bg-elevated p-4 shadow-2xl">
            <div className="mb-3 flex gap-1.5">
              <span className="size-2.5 rounded-full bg-danger/70" />
              <span className="size-2.5 rounded-full bg-warning/70" />
              <span className="size-2.5 rounded-full bg-success/70" />
            </div>
            <pre className="font-mono text-[11px] leading-relaxed text-muted">
              <code>
                <span className="text-brand">$</span> npm create techlab@latest{"\n"}
                <span className="text-success">✓</span> 13 ferramentas prontas{"\n"}
                <span className="text-success">✓</span> SEO configurado{"\n"}
                <span className="text-success">✓</span> deploy em 1 comando{"\n\n"}
                <span className="text-brand">$</span>{" "}
                <span className="inline-block h-3.5 w-1.5 animate-pulse bg-brand align-middle" />
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
