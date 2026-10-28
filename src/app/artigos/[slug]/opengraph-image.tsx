import { ImageResponse } from "next/og";
import { loadPost } from "@/lib/posts";
import { categories, siteConfig } from "@/lib/site";

// Must match the article route's params so Next prerenders one card per post.
export function generateStaticParams() {
  return import("@/lib/posts").then(({ getAllPosts }) =>
    getAllPosts().then((posts) => posts.map((p) => ({ slug: p.slug }))),
  );
}

export const alt = "Artigo do TechLab";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await loadPost(slug);

  const title = post?.meta.title ?? siteConfig.name;
  const description = post?.meta.description ?? siteConfig.tagline;
  const category = categories.find((c) => c.slug === post?.meta.category);
  const accent = category?.accent ?? "#3b8dff";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#070b12",
          padding: 72,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -140,
            width: 640,
            height: 640,
            borderRadius: 999,
            background: `${accent}44`,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 15,
              background: "linear-gradient(135deg, #4da3ff 0%, #22d3ee 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#04101f",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            {"</>"}
          </div>
          <div
            style={{
              // Satori requires an explicit display on any div with >1 child.
              display: "flex",
              fontSize: 30,
              fontWeight: 800,
              color: "#e8eef9",
            }}
          >
            Tech<span style={{ color: "#3b8dff" }}>Lab</span>
          </div>
          {category && (
            <div
              style={{
                marginLeft: 8,
                fontSize: 22,
                color: accent,
                border: `2px solid ${accent}`,
                borderRadius: 999,
                padding: "6px 20px",
              }}
            >
              {category.name}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: title.length > 60 ? 52 : 62,
              fontWeight: 800,
              color: "#e8eef9",
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 27,
              color: "#93a4bf",
              lineHeight: 1.35,
              // Satori has no -webkit-box; clamp by slicing the string instead.
            }}
          >
            {description.length > 150 ? `${description.slice(0, 147)}…` : description}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
