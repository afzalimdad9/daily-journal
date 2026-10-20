"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { BlogPostSummary } from "@blog/shared-types";
import { Input } from "@/components/ui/input";

export default function SearchPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [error, setError] = useState("");

  async function search(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setPosts([]);
      setError("");
      return;
    }
    try {
      const response = await fetch(`/api/posts?q=${encodeURIComponent(value)}&locale=${encodeURIComponent(locale)}`);
      if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
      const data = await response.json() as { posts: BlogPostSummary[] };
      setPosts(data.posts);
      setError("");
    } catch {
      setPosts([]);
      setError(t("searchError"));
    }
  }

  return (
    <section className="container min-h-[50vh] py-10">
      <h1 className="mb-5 text-3xl font-bold">{t("searchTitle")}</h1>
      <Input className="mb-6 max-w-xl" value={query} onChange={(event) => void search(event.target.value)} placeholder={t("searchPlaceholder")} />
      {error && <p role="alert" className="mb-4 text-red-600">{error}</p>}
      <ul className="space-y-4">{posts.map((post) => <li key={post.slug}><Link className="font-semibold text-indigo-600" href={`/${post.locale}/posts/${post.slug}`}>{post.title}</Link><p className="text-sm text-[var(--muted)]">{post.description}</p></li>)}</ul>
    </section>
  );
}
