import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { featuredTools } from "@/lib/tools";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="font-mono text-6xl font-extrabold text-brand">404</p>

      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
        Página não encontrada
      </h1>

      <p className="mt-3 text-base leading-relaxed text-muted">
        O endereço que você tentou abrir não existe ou foi movido. Aproveite para
        conhecer uma ferramenta — elas funcionam todas no navegador.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Voltar ao início</ButtonLink>
        <ButtonLink href="/ferramentas" variant="secondary">
          Ver todas as ferramentas
        </ButtonLink>
      </div>

      <ul className="mt-12 grid w-full gap-2 sm:grid-cols-2">
        {featuredTools.slice(0, 4).map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/ferramentas/${tool.slug}`}
              className="block rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted transition-colors hover:border-brand/50 hover:text-fg"
            >
              {tool.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
