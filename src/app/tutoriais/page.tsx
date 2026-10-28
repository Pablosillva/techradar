import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tutoriais de programação e tecnologia",
  description:
    "Tutoriais passo a passo de React, TypeScript, Python, Node.js, Docker, Linux e Git. Do básico ao avançado, com código e explicações.",
  alternates: { canonical: "/tutoriais" },
  openGraph: {
    title: `Tutoriais passo a passo | ${siteConfig.name}`,
    description:
      "Guias práticos de React, TypeScript, Python, Node.js, Docker, Linux e Git.",
    url: "/tutoriais",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
  },
};

export default async function TutoriaisPage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow={
          <>
            <BookOpen className="mr-1 inline size-3.5" aria-hidden="true" />
            Tutorial
          </>
        }
        title="Tutoriais"
        description="Guias passo a passo, escritos para você acompanhar sem pular etapas. Cada tutorial vai do conceito à implementação funcionando."
      />

      {posts.length > 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug} className="flex">
              <div className="flex w-full">
                <PostCard post={post} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line px-6 py-16 text-center text-sm text-subtle">
          Nenhum tutorial publicado ainda. Volte em breve.
        </p>
      )}
    </div>
  );
}
