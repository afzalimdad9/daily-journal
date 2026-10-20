"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { BlogPostSummary } from "@blog/shared-types";
import { formatDate } from "@/lib/format-date";
import { SearchResultsSkeleton } from "@/components/loading-skeleton";

export default function SearchPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const latestRequest = useRef(0);

  async function search(value: string) {
    const requestId = ++latestRequest.current;
    setQuery(value);
    if (!value.trim()) {
      setError("");
      setSearching(false);
      return;
    }
    setPosts([]);
    setTotal(0);
    setError("");
    setSearching(true);
    try {
      const response = await fetch(`/api/posts?q=${encodeURIComponent(value)}&locale=${encodeURIComponent(locale)}`);
      if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
      const data = await response.json() as { posts: BlogPostSummary[]; total: number };
      if (requestId !== latestRequest.current) return;
      setPosts(data.posts);
      setTotal(data.total);
      setError("");
      setSearching(false);
    } catch {
      if (requestId !== latestRequest.current) return;
      setPosts([]);
      setTotal(0);
      setError(t("searchError"));
      setSearching(false);
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
            <button className="search-button" type="button" onClick={() => void search(query)}>{t("search")}</button>
          </div>
          {error && <p role="alert" className="search-status">{error}</p>}
          {searching && <p className="search-status" role="status">{t("searching")}</p>}
          {!error && !searching && query.trim() && <p className="search-status" role="status">{total} {t(total === 1 ? "articleLabel" : "articlesLabel")}</p>}
        </div>
      </header>
      <section className="container prose-page">
        {searching && posts.length === 0 && <SearchResultsSkeleton />}
        {query.trim() && !error && !searching && posts.length === 0 && <p className="empty-state">{t("noSearchResults")}</p>}
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
