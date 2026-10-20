import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "@/lib/posts";

type Props = { params: Promise<{ locale: string; category: string }> };

export async function generateStaticParams() {
  const categories = new Set(getPosts().map((post) => post.category?.toLowerCase()).filter((category): category is string => Boolean(category)));
  return [...categories].map((category) => ({ category }));
}

export default async function CategoryPage({ params }: Props) {
  const { locale, category } = await params;
  const posts = getPosts(locale).filter((post) => post.category?.toLowerCase() === decodeURIComponent(category).toLowerCase());
  if (!posts.length) notFound();

  return (
    <section className="container min-h-[50vh] py-10">
      <h1 className="mb-6 text-3xl font-bold">{decodeURIComponent(category)}</h1>
      <ul className="space-y-5">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link className="text-xl font-semibold text-indigo-600" href={`/${locale}/posts/${post.slug}`}>{post.title}</Link>
            <p className="mt-1 text-[var(--muted)]">{post.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
