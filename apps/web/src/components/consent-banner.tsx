"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(localStorage.getItem("ad-consent") === null);
  }, []);

  if (!show) return null;
  return (
    <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-xl border bg-[var(--surface)] p-4 shadow-xl">
      <p className="mb-3 text-sm">We use advertising cookies to support this publication. You can accept or decline personalized ads.</p>
      <div className="flex gap-3">
        <Button onClick={() => { localStorage.setItem("ad-consent", "accepted"); window.dispatchEvent(new Event("ad-consent-changed")); setShow(false); }}>Accept</Button>
        <Button variant="outline" onClick={() => { localStorage.setItem("ad-consent", "declined"); window.dispatchEvent(new Event("ad-consent-changed")); setShow(false); }}>Decline</Button>
      </div>
    </aside>
  );
}
