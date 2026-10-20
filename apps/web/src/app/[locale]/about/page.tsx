import { getTranslations } from "next-intl/server";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return (
    <>
      <header className="page-hero">
        <div className="container">
          <span className="eyebrow">{t("heroEyebrow")}</span>
          <h1 className="page-title">{t("aboutTitle")}</h1>
          <p className="page-intro">{t("aboutText")}</p>
        </div>
      </header>
      <div className="container prose-page">
        <h2>{t("aboutPurposeTitle")}</h2>
        <p>{t("aboutPurpose")}</p>
        <h2>{t("aboutStandardsTitle")}</h2>
        <p>{t("aboutStandards")}</p>
        <ul>
          <li>{t("aboutStandardOne")}</li>
          <li>{t("aboutStandardTwo")}</li>
          <li>{t("aboutStandardThree")}</li>
        </ul>
      </div>
    </>
  );
}
