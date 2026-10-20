"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const active = (path: string) => pathname === `/${locale}${path}` || (path !== "" && pathname.startsWith(`/${locale}${path}/`));

  return (
    <header className="site-header">
      <nav className="container site-nav" aria-label="Main navigation">
        <Link className="brand" href={`/${locale}`} aria-label="Daily Journal home">
          <span className="brand-mark" aria-hidden="true">dj</span>
          <span>Daily Journal</span>
        </Link>
        <div className="nav-links">
          <Link aria-current={active("") ? "page" : undefined} className={`nav-link${active("") ? " nav-link-active" : ""}`} href={`/${locale}`}>{t("home")}</Link>
          <Link aria-current={active("/search") ? "page" : undefined} className={`nav-link${active("/search") ? " nav-link-active" : ""}`} href={`/${locale}/search`}>{t("search")}</Link>
          <Link aria-current={active("/about") ? "page" : undefined} className={`nav-link${active("/about") ? " nav-link-active" : ""}`} href={`/${locale}/about`}>{t("about")}</Link>
          <Link aria-current={active("/contact") ? "page" : undefined} className={`nav-link${active("/contact") ? " nav-link-active" : ""}`} href={`/${locale}/contact`}>{t("contact")}</Link>
        </div>
        <label className="sr-only" htmlFor="locale">Language</label>
        <select id="locale" className="locale-select" value={locale} onChange={(event) => { window.location.href = `${window.location.pathname.replace(/^\/[^/]+/, `/${event.target.value}`)}${window.location.search}`; }}>
          {["en", "es", "fr", "de", "ar"].map((language) => <option key={language} value={language}>{language.toUpperCase()}</option>)}
        </select>
      </nav>
    </header>
  );
}
