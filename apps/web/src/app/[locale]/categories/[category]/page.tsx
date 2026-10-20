import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "@/lib/posts";
import { formatDate } from "@/lib/format-date";
import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ locale: string; category: string }> };

export async function generateStaticParams() {
  const categories = new Set(getPosts().map((post) => post.category?.toLowerCase()).filter((category): category is string => Boolean(category)));
  return [...categories].map((category) => ({ category }));
}

export default async function CategoryPage({ params }: Props) {
  const { locale, category } = await params;
  const categoryName = decodeURIComponent(category);
  const posts = getPosts(locale).filter((post) => post.category?.toLowerCase() === categoryName.toLowerCase());
  if (!posts.length) notFound();
  const t = await getTranslations({ locale });
  const categoryTitle = posts[0].category ?? categoryName;

  return (
    <>
      <header className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("categoryLabel")}</span>
          <h1 className="page-title">{categoryTitle}</h1>
          <p className="page-intro">{posts.length} {t(posts.length === 1 ? "articleLabel" : "articlesLabel")}</p>
        </div>
      </header>
      <section className="container prose-page">
        <div className="post-grid">
          {posts.map((post) => (
            <article className="post-card" key={post.slug}>
              <div className="post-meta"><time dateTime={post.date}>{formatDate(post.date, locale)}</time></div>
              <h3><Link href={`/${locale}/posts/${post.slug}`}>{post.title}</Link></h3>
              <p>{post.description}</p>
              <Link className="text-link" href={`/${locale}/posts/${post.slug}`}>{t("readMore")} <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
