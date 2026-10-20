import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPosts } from "@/lib/posts";
import { formatDate } from "@/lib/format-date";
import { AdSlot } from "@/components/ad-slot";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const posts = getPosts(locale);
  const t = await getTranslations({ locale });
  const [featured, ...latest] = posts;

  return (
    <>
      <section className="container home-hero">
        <div>
          <span className="eyebrow">{t("heroEyebrow")}</span>
          <h1 className="hero-title">{t("homeTitle")}</h1>
          <p className="hero-copy">{t("homeSubtitle")}</p>
        </div>
        <div className="hero-art" aria-hidden="true"><span>dj</span><i className="hero-orbit" /></div>
      </section>

      <section className="container featured-section">
        <div className="section-heading">
          <h2 className="section-title">{t("featured")}</h2>
          <Link className="text-link" href={`/${locale}/search`}>{t("search")} <span aria-hidden="true">↗</span></Link>
        </div>
        {featured ? (
          <article className="featured-card">
            <div className="featured-visual" aria-hidden="true">
              <span className="visual-index">Daily Journal / 01</span>
              <span className="visual-word">{featured.category ?? "Ideas"}</span>
            </div>
            <div className="featured-copy">
              <div className="post-meta">
                {featured.category && <Link className="category-pill" href={`/${locale}/categories/${encodeURIComponent(featured.category.toLowerCase())}`}>{featured.category}</Link>}
                <time dateTime={featured.date}>{formatDate(featured.date, locale)}</time>
                <span>·</span>
                <span>{featured.author}</span>
              </div>
              <h3 className="featured-title"><Link href={`/${locale}/posts/${featured.slug}`}>{featured.title}</Link></h3>
              <p className="featured-description">{featured.description}</p>
              <Link className="text-link" href={`/${locale}/posts/${featured.slug}`}>{t("readMore")} <span aria-hidden="true">→</span></Link>
            </div>
          </article>
        ) : <p className="empty-state">{t("empty")}</p>}
      </section>

      {latest.length > 0 && (
        <section className="latest-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="section-kicker">{posts.length} {t("articlesLabel")}</p>
                <h2 className="section-title">{t("latest")}</h2>
              </div>
            </div>
            <div className="post-grid">
              {latest.map((post, index) => (
                <div className="post-grid-item" key={post.slug}>
                  <article className="post-card">
                    <div className="post-meta">
                      {post.category && <Link className="category-pill" href={`/${locale}/categories/${encodeURIComponent(post.category.toLowerCase())}`}>{post.category}</Link>}
                      <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
                    </div>
                    <h3><Link href={`/${locale}/posts/${post.slug}`}>{post.title}</Link></h3>
                    <p>{post.description}</p>
                    <Link className="text-link" href={`/${locale}/posts/${post.slug}`}>{t("readMore")} <span aria-hidden="true">→</span></Link>
                  </article>
                  {(index + 2) % 4 === 0 && <AdSlot className="mt-4" slotId="in-feed" format="in-feed" />}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
