import { getTranslations } from "next-intl/server";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return <section className="container min-h-[50vh] py-12"><h1 className="mb-5 text-4xl font-bold">{t("contactTitle")}</h1><p className="max-w-2xl text-[var(--muted)]">{t("contactText")} <a className="text-indigo-600 underline" href="mailto:hello@example.com">hello@example.com</a>.</p></section>;
}
