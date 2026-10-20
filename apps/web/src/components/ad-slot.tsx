"use client";

import { useEffect, useRef, useState } from "react";

type AdSlotProps = {
  slotId: string;
  format: "leaderboard" | "in-feed" | "in-article" | "sidebar" | "footer" | "anchor";
  className?: string;
};

const adUnits: Record<string, string | undefined> = {
  "header-banner": process.env.NEXT_PUBLIC_ADSENSE_SLOT_HEADER,
  "footer-banner": process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER,
  "mobile-anchor": process.env.NEXT_PUBLIC_ADSENSE_SLOT_ANCHOR,
  "article-sidebar": process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
  "article-mid": process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE,
  "article-after-second-paragraph": process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE,
  "in-feed": process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_FEED
};

export function AdSlot({ slotId, format, className = "" }: AdSlotProps) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [consented, setConsented] = useState(false);
  const adUnitId = adUnits[slotId];

  useEffect(() => {
    const syncConsent = () => setConsented(localStorage.getItem("ad-consent") === "accepted");
    syncConsent();
    window.addEventListener("ad-consent-changed", syncConsent);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    if (container.current) observer.observe(container.current);
    return () => {
      observer.disconnect();
      window.removeEventListener("ad-consent-changed", syncConsent);
    };
  }, []);

  useEffect(() => {
    if (!visible || !consented) return;
    setBlocked(false);
    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
    if (!client || !adUnitId) {
      setBlocked(true);
      return;
    }

    const selector = 'script[data-adsense-client="true"]';
    let script = document.querySelector<HTMLScriptElement>(selector);
    const isNew = !script;
    if (script?.dataset.failed === "true") {
      setBlocked(true);
      return;
    }
    if (!script) {
      script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.adsenseClient = "true";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
      document.head.appendChild(script);
    }

    let timer: number | undefined;
    const onLoad = () => {
      try {
        const adsWindow = window as Window & { adsbygoogle?: unknown[] };
        (adsWindow.adsbygoogle ??= []).push({});
        timer = window.setTimeout(() => {
          setBlocked(!container.current?.querySelector("ins.adsbygoogle"));
        }, 1500);
      } catch {
        console.warn("Ad slot initialization failed; showing the ad-support fallback.");
        setBlocked(true);
      }
    };
    const onError = () => {
      script!.dataset.failed = "true";
      console.warn("Ad script failed to load; showing the ad-support fallback.");
      setBlocked(true);
    };
    if (script.dataset.loaded === "true") onLoad();
    else {
      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });
    }
    if (isNew) script.addEventListener("load", () => { script!.dataset.loaded = "true"; }, { once: true });
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
    };
  }, [visible, consented, adUnitId]);

  return (
    <div ref={container} className={`ad-slot ad-${format} ${className}`} aria-label="Advertisement">
      {visible && consented && !blocked && process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && adUnitId ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block", minHeight: 50 }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? ""}
          data-ad-slot={adUnitId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <span>{blocked ? "Please consider supporting this site by allowing ads." : "Advertisement"}</span>
      )}
    </div>
  );
}
