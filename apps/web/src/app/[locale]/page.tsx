import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPosts } from "@/lib/posts";
import { AdSlot } from "@/components/ad-slot";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const posts = getPosts(locale);
  const t = await getTranslations({ locale });

  return (
    <section className="container py-10">
      <h1 className="mb-2 text-4xl font-bold">{t("homeTitle")}</h1>
      <p className="mb-8 max-w-2xl text-[var(--muted)]">{t("homeSubtitle")}</p>
      <h2 className="mb-5 text-2xl font-semibold">{t("latest")}</h2>
      {posts.length === 0 ? <p>{t("empty")}</p> : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <div key={post.slug}>
              <Card className="h-full p-6">
                <article>
                <p className="mb-2 text-xs text-[var(--muted)]">{post.category ?? "Journal"} · {formatDate(post.date, locale)}</p>
                <h3 className="mb-3 text-xl font-semibold"><Link href={`/${locale}/posts/${post.slug}`}>{post.title}</Link></h3>
                <p className="mb-5 text-sm text-[var(--muted)]">{post.description}</p>
                <Link className="font-medium text-indigo-600" href={`/${locale}/posts/${post.slug}`}>{t("readMore")} →</Link>
                </article>
              </Card>
              {(index + 1) % 4 === 0 && <AdSlot className="mt-4" slotId="in-feed" format="in-feed" />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
