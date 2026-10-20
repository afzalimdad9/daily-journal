import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { ConsentBanner } from "@/components/consent-banner";
import { AdSlot } from "@/components/ad-slot";
import { getTranslations } from "next-intl/server";
import "../globals.css";

export const dynamicParams = false;

export const metadata: Metadata = {
  title: { default: "Daily Journal", template: "%s | Daily Journal" },
  description: "Thoughtful articles on ideas, technology, and everyday life.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://daily-journal-afzalimdad9.vercel.app"),
  alternates: {
    languages: Object.fromEntries(routing.locales.map((locale) => [locale, `/${locale}`]))
  },
  openGraph: { type: "website", siteName: "Daily Journal" }
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations({ locale });

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <SiteHeader locale={locale} />
          <div className="container"><AdSlot slotId="header-banner" format="leaderboard" /></div>
          <main>{children}</main>
          <footer className="site-footer">
            <div className="container">
              <div className="mb-4"><AdSlot slotId="footer-banner" format="footer" /></div>
              <div className="footer-inner">
                <div>
                  <a className="brand" href={`/${locale}`}><span className="brand-mark" aria-hidden="true">dj</span><span>Daily Journal</span></a>
                  <p className="footer-note">{t("footerNote")}</p>
                </div>
                <nav className="footer-links" aria-label="Footer navigation">
                  <a href={`/${locale}/about`}>{t("about")}</a>
                  <a href={`/${locale}/contact`}>{t("contact")}</a>
                  <a href={`/${locale}/privacy`}>{t("privacy")}</a>
                  <a href={`/${locale}/terms`}>{t("terms")}</a>
                </nav>
              </div>
              <div className="footer-bottom">
                <span>© {new Date().getFullYear()} Daily Journal</span>
                <span>{t("footerByline")}</span>
              </div>
            </div>
          </footer>
          <AdSlot className="mobile-anchor" slotId="mobile-anchor" format="anchor" />
          <ConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
