import { getTranslations } from "next-intl/server";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return (
    <>
      <header className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("terms")}</span>
          <h1 className="page-title">{t("termsTitle")}</h1>
          <p className="page-intro">{t("termsText")}</p>
        </div>
      </header>
      <article className="container prose-page">
        <p><strong>{t("policyUpdated")}</strong></p>
        <h2>{t("termsUseTitle")}</h2>
        <p>{t("termsUse")}</p>
        <h2>{t("termsContentTitle")}</h2>
        <p>{t("termsContent")}</p>
        <h2>{t("termsLinksTitle")}</h2>
        <p>{t("termsLinks")}</p>
        <h2>{t("termsChangesTitle")}</h2>
        <p>{t("termsChanges")}</p>
      </article>
    </>
  );
}
