import { Flame } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { Pillars } from "@/components/home/pillars";
import {
  CategoryShowcase,
  NewsPanel,
  NewsletterCard,
  PopularTools,
  PromoCard,
  ToolsPanel,
} from "@/components/home/sidebar";
import { PostCard } from "@/components/post-card";
import { SectionHeading } from "@/components/ui";
import { getFeaturedPosts } from "@/lib/posts";
import { news } from "@/lib/news";
import { formatDate } from "@/lib/site";

export default async function HomePage() {
  const featured = await getFeaturedPosts(5);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ------------------------------ Main column ------------------------------ */}
        <div className="min-w-0 space-y-6">
          <Hero />
          <Pillars />

          <section aria-labelledby="artigos-destaque">
            <SectionHeading
              icon={<Flame className="size-5 text-warning" aria-hidden="true" />}
              title={<span id="artigos-destaque">Artigos em destaque</span>}
              action={{ href: "/artigos", label: "Ver todos" }}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {featured.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>

          <CategoryShowcase />

          <PopularTools />
        </div>

        {/* ------------------------------ Sidebar --------------------------------- */}
        <aside className="space-y-6">
          <ToolsPanel />
          <NewsPanel
            items={news.map((n) => ({
              ...n,
              date: formatDate(n.date),
            }))}
          />
          <NewsletterCard />
          <PromoCard />
        </aside>
      </div>
    </div>
  );
}
