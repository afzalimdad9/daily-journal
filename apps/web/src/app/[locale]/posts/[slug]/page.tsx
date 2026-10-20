import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPost, getPosts } from "@/lib/posts";
import { AdSlot } from "@/components/ad-slot";
import { formatDate } from "@/lib/format-date";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  return getPosts().map((post) => ({ locale: post.locale, slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(slug, locale);
  if (!post) return {};
  const languages = Object.fromEntries(
    getPosts()
      .filter((candidate) => candidate.slug === post.slug)
      .map((candidate) => [candidate.locale, `/${candidate.locale}/posts/${candidate.slug}`])
  );
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/${locale}/posts/${slug}`, languages },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date, authors: [post.author] }
  };
}

export default async function PostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = getPost(slug, locale);
  if (!post) notFound();

  return (
    <article className="container py-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,72ch)_300px]">
          <div>
            <header className="mb-8">
              <p className="mb-3 text-sm text-[var(--muted)]">{post.category ?? "Journal"} · <time dateTime={post.date}>{formatDate(post.date, locale)}</time> · {post.author}</p>
              <h1 className="text-4xl font-bold">{post.title}</h1>
              <p className="mt-4 text-lg text-[var(--muted)]">{post.description}</p>
            </header>
            <div className="article-content">
              {(() => {
                let paragraphCount = 0;
                return (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => {
                        paragraphCount += 1;
                        return (
                          <>
                            <p>{children}</p>
                            {paragraphCount === 2 && <AdSlot slotId="article-after-second-paragraph" format="in-article" />}
                          </>
                        );
                      }
                    }}
                  >
                    {post.content.replace(/^# .+\r?\n+/, "")}
                  </ReactMarkdown>
                );
              })()}
              <div className="my-8"><AdSlot slotId="article-mid" format="in-article" /></div>
            </div>
          </div>
          <aside className="hidden lg:block"><AdSlot slotId="article-sidebar" format="sidebar" /></aside>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        author: { "@type": "Person", name: post.author },
        mainEntityOfPage: new URL(`/${locale}/posts/${post.slug}`, process.env.NEXT_PUBLIC_SITE_URL || "https://example.com").toString()
      }).replace(/</g, "\\u003c") }} />
    </article>
  );
}
