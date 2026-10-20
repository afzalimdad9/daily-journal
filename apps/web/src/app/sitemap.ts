import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/posts";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://daily-journal-afzalimdad9.vercel.app").replace(/\/+$/, "");
  const routes = ["", "/about", "/contact", "/privacy", "/terms", "/search"];
  const staticEntries = routing.locales.flatMap((locale) => routes.map((route) => ({
    url: `${base}/${locale}${route}`,
    alternates: { languages: Object.fromEntries(routing.locales.map((language) => [language, `${base}/${language}${route}`])) }
  })));
  const allPosts = getPosts();
  const posts = allPosts.map((post) => ({
    url: `${base}/${post.locale}/posts/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    alternates: {
      languages: Object.fromEntries(
        allPosts
          .filter((candidate) => candidate.slug === post.slug)
          .map((candidate) => [candidate.locale, `${base}/${candidate.locale}/posts/${candidate.slug}`])
      )
    }
  }));
  return [...staticEntries, ...posts];
}
