import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { BlogPost, BlogPostSummary } from "@blog/shared-types";

const postsDirectory = path.join(process.cwd(), "..", "..", "content", "posts");

function readPosts(): BlogPost[] {
  if (!fs.existsSync(postsDirectory)) return [];

  return fs.readdirSync(postsDirectory)
    .filter((filename) => /\.(md|mdx)$/i.test(filename))
    .map((filename) => {
      const file = fs.readFileSync(path.join(postsDirectory, filename), "utf8");
      const { data, content } = matter(file);
      return {
        title: String(data.title ?? ""),
        slug: String(data.slug ?? filename.replace(/\.(md|mdx)$/i, "")),
        description: String(data.description ?? ""),
        date: String(data.date ?? ""),
        locale: String(data.locale ?? "en"),
        keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
        author: String(data.author ?? "Editorial Team"),
        category: data.category ? String(data.category) : undefined,
        image: data.image ? String(data.image) : undefined,
        content
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPosts(locale?: string): BlogPost[] {
  return readPosts().filter((post) => !locale || post.locale === locale);
}

export function getPost(slug: string, locale: string): BlogPost | undefined {
  return getPosts(locale).find((post) => post.slug === slug);
}

export function toSummary(post: BlogPost): BlogPostSummary {
  const { content: _content, ...summary } = post;
  return summary;
}
