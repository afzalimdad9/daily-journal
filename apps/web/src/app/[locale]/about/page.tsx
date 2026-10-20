import { getTranslations } from "next-intl/server";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return <section className="container min-h-[50vh] py-12"><h1 className="mb-5 text-4xl font-bold">{t("aboutTitle")}</h1><p className="max-w-2xl text-lg text-[var(--muted)]">{t("aboutText")}</p></section>;
}
