import { getTranslations } from "next-intl/server";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return (
    <>
      <header className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("heroEyebrow")}</span>
          <h1 className="page-title">{t("contactTitle")}</h1>
          <p className="page-intro">{t("contactText")}</p>
        </div>
      </header>
      <section className="container prose-page">
        <h2>{t("contactEditorialTitle")}</h2>
        <p>{t("contactEditorialText")} <a href="https://github.com/afzalimdad9/daily-journal/issues">{t("contactIssueLink")}</a>.</p>
        <h2>{t("contactResponseTitle")}</h2>
        <p>{t("contactResponseText")}</p>
      </section>
    </>
  );
}
