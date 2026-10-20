"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { BlogPostSummary } from "@blog/shared-types";
import { formatDate } from "@/lib/format-date";

export default function SearchPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  async function search(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setPosts([]);
      setTotal(0);
      setError("");
      return;
    }
    try {
      const response = await fetch(`/api/posts?q=${encodeURIComponent(value)}&locale=${encodeURIComponent(locale)}`);
      if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
      const data = await response.json() as { posts: BlogPostSummary[]; total: number };
      setPosts(data.posts);
      setTotal(data.total);
      setError("");
    } catch {
      setPosts([]);
      setTotal(0);
      setError(t("searchError"));
    }
  }

  return (
    <>
      <header className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("heroEyebrow")}</span>
          <h1 className="page-title">{t("searchTitle")}</h1>
          <p className="page-intro">{t("searchIntro")}</p>
          <div className="search-form">
            <div className="search-input-wrap">
              <label className="sr-only" htmlFor="article-search">{t("searchPlaceholder")}</label>
              <input id="article-search" className="search-field" type="search" value={query} onChange={(event) => void search(event.target.value)} placeholder={t("searchPlaceholder")} />
            </div>
            <span className="search-button" aria-hidden="true">{t("search")}</span>
          </div>
          {error && <p role="alert" className="search-status">{error}</p>}
          {!error && query.trim() && <p className="search-status" role="status">{total} {t("articlesLabel")}</p>}
        </div>
      </header>
      <section className="container prose-page">
        {query.trim() && !error && posts.length === 0 && <p className="empty-state">{t("noSearchResults")}</p>}
        {posts.length > 0 && (
          <div className="search-results">
            {posts.map((post) => (
              <article className="search-result" key={`${post.locale}:${post.slug}`}>
                <div className="post-meta">
                  {post.category && <span className="category-pill">{post.category}</span>}
                  <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
                </div>
                <h2><Link href={`/${post.locale}/posts/${post.slug}`}>{post.title}</Link></h2>
                <p>{post.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
