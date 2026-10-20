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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
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
          <div className="container py-4"><AdSlot slotId="header-banner" format="leaderboard" /></div>
          <main>{children}</main>
          <footer className="container my-10 border-t py-8 text-sm text-[var(--muted)]">
            <div className="mb-4"><AdSlot slotId="footer-banner" format="footer" /></div>
            <p>© {new Date().getFullYear()} Daily Journal</p>
            <nav className="mt-2 flex gap-4"><a href={`/${locale}/privacy`}>{t("privacy")}</a><a href={`/${locale}/terms`}>{t("terms")}</a><a href={`/${locale}/contact`}>{t("contact")}</a></nav>
          </footer>
          <AdSlot className="mobile-anchor" slotId="mobile-anchor" format="anchor" />
          <ConsentBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
