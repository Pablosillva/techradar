import Link from "next/link";
import { Logo } from "@/components/logo";
import {
  GithubIcon,
  LinkedinIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/ui/social-icons";
import { mainNav, categories, siteConfig } from "@/lib/site";
import { tools, toolCategories } from "@/lib/tools";

const legalLinks = [
  { href: "/termos-de-uso", label: "Termos de Uso" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/contato", label: "Contato" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-bg-elevated">
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo className="size-9" />
              <span className="flex flex-col leading-none">
                <span className="text-lg font-extrabold tracking-tight text-fg">
                  Tech<span className="text-brand">Lab</span>
                </span>
                <span className="mt-1 text-[10px] font-medium tracking-wide text-subtle">
                  Tecnologia · IA · Programação · Ferramentas
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {siteConfig.description}
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialLink href={siteConfig.social.youtube} label="YouTube">
                <YoutubeIcon className="size-4" />
              </SocialLink>
              <SocialLink href={siteConfig.social.github} label="GitHub">
                <GithubIcon className="size-4" />
              </SocialLink>
              <SocialLink href={siteConfig.social.x} label="X">
                <XIcon className="size-4" />
              </SocialLink>
              <SocialLink href={siteConfig.social.linkedin} label="LinkedIn">
                <LinkedinIcon className="size-4" />
              </SocialLink>
            </div>
          </div>

          <FooterColumn title="Navegação">
            {mainNav.map((item) => (
              <FooterLink key={item.href} {...item} />
            ))}
          </FooterColumn>

          <FooterColumn title="Categorias">
            {categories.map((c) => (
              <FooterLink key={c.slug} href={`/categorias/${c.slug}`} label={c.name} />
            ))}
          </FooterColumn>

          <FooterColumn title="Ferramentas">
            {Object.values(toolCategories).slice(0, 5).map((c) => (
              <FooterLink
                key={c.slug}
                href={`/ferramentas/categoria/${c.slug}`}
                label={c.name}
              />
            ))}
            <FooterLink href="/ferramentas" label={`Todas as ${tools.length} ferramentas →`} />
          </FooterColumn>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-subtle">
            © {new Date().getFullYear()} {siteConfig.name}. Todos os direitos reservados.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-xs text-subtle transition-colors hover:text-muted"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-fg">{title}</h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted transition-colors hover:text-brand"
      >
        {label}
      </Link>
    </li>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:border-brand/50 hover:text-brand"
    >
      {children}
    </a>
  );
}
