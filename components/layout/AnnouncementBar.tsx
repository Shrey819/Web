"use client";

import React, { useState, useEffect } from "react";

interface AnnouncementBarProps {
  text?: string;
}

export function AnnouncementBar({ text: initialText }: AnnouncementBarProps) {
  const [tickerText, setTickerText] = useState(
    initialText ||
      "🎁 BUY ANY 2 PRODUCTS & GET 1 PREMIUM GOGGLE FREE • FREE SHIPPING • CASH ON DELIVERY • SHOP NOW"
  );

  useEffect(() => {
    if (!initialText) {
      fetch("/api/homepage")
        .then((res) => res.json())
        .then((data) => {
          if (data?.promoTicker) {
            setTickerText(data.promoTicker);
          }
        })
        .catch(() => {});
    }
  }, [initialText]);

  return (
    <div
      className="bg-slate-950 text-amber-400 border-b border-slate-900 overflow-hidden select-none py-2 text-[11px] sm:text-xs font-semibold tracking-wider font-mono uppercase relative z-40 group shadow-inner"
      aria-label="Promotional Announcement"
    >
      <div className="flex w-full overflow-hidden">
        {/* Track 1 */}
        <div className="flex shrink-0 whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          <span className="px-6 flex items-center gap-3">{tickerText}</span>
          <span className="px-6 flex items-center gap-3">{tickerText}</span>
          <span className="px-6 flex items-center gap-3">{tickerText}</span>
        </div>

        {/* Duplicate track for seamless infinite loop */}
        <div
          className="flex shrink-0 whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          aria-hidden="true"
        >
          <span className="px-6 flex items-center gap-3">{tickerText}</span>
          <span className="px-6 flex items-center gap-3">{tickerText}</span>
          <span className="px-6 flex items-center gap-3">{tickerText}</span>
        </div>
      </div>
    </div>
  );
}
