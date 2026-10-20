import { getTranslations } from "next-intl/server";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return (
    <>
      <header className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("privacy")}</span>
          <h1 className="page-title">{t("privacyTitle")}</h1>
          <p className="page-intro">{t("privacyText")}</p>
        </div>
      </header>
      <article className="container prose-page">
        <p><strong>{t("policyUpdated")}</strong></p>
        <h2>{t("privacyDataTitle")}</h2>
        <p>{t("privacyData")}</p>
        <h2>{t("privacyStorageTitle")}</h2>
        <p>{t("privacyStorage")}</p>
        <h2>{t("privacyAdsTitle")}</h2>
        <p>{t("privacyAds")}</p>
        <h2>{t("privacyThirdPartyTitle")}</h2>
        <p>{t("privacyThirdParty")}</p>
        <h2>{t("privacyContactTitle")}</h2>
        <p>{t("privacyContact")} <a href="https://github.com/afzalimdad9/daily-journal/issues">{t("contactIssueLink")}</a>.</p>
      </article>
    </>
  );
}
