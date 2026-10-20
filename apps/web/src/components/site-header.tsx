"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations();
  return (
    <header className="border-b border-black/10 py-4 dark:border-white/10">
      <nav className="container flex items-center justify-between gap-4" aria-label="Main navigation">
        <Link className="text-xl font-bold" href={`/${locale}`}>Daily Journal</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href={`/${locale}`}>{t("home")}</Link>
          <Link href={`/${locale}/search`}>{t("search")}</Link>
          <Link href={`/${locale}/about`}>{t("about")}</Link>
          <label className="sr-only" htmlFor="locale">Language</label>
          <select id="locale" className="rounded border bg-transparent p-2" value={locale} onChange={(event) => { window.location.href = `${window.location.pathname.replace(/^\/[^/]+/, `/${event.target.value}`)}${window.location.search}`; }}>
            {["en", "es", "fr", "de", "ar"].map((language) => <option key={language} value={language}>{language.toUpperCase()}</option>)}
          </select>
        </div>
      </nav>
    </header>
  );
}
