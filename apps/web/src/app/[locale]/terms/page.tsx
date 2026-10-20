import { getTranslations } from "next-intl/server";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return <section className="container min-h-[50vh] py-12"><h1 className="mb-5 text-4xl font-bold">{t("termsTitle")}</h1><p className="max-w-2xl text-[var(--muted)]">{t("termsText")}</p></section>;
}
