import type { NextConfig } from "next";
import createMDX from "@next/mdx";

// Plugins are declared by name (not imported as functions) so that the same
// config works with both the Turbopack and webpack builds. remark/rehype
// plugins with non-serializable options are not supported under Turbopack.
const withMDX = createMDX({
  options: {
    remarkPlugins: [
      "remark-gfm", // GitHub Flavored Markdown: tables, task lists, strikethrough
      "remark-frontmatter", // strips the YAML block out of the rendered output
      "remark-mdx-frontmatter", // re-exposes it as a `frontmatter` named export
    ],
    rehypePlugins: ["rehype-slug"], // stable heading ids for deep links / TOC
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withMDX(nextConfig);
