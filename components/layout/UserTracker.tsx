"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackUserAction } from "@/lib/trackerClient";
import { useUserStore } from "@/store/useUserStore";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("om_user_session_id");
  if (!id) {
    id = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem("om_user_session_id", id);
  }
  return id;
}

function detectDeviceType(): "Desktop" | "Mobile" | "Tablet" {
  if (typeof window === "undefined") return "Desktop";
  const ua = navigator.userAgent;
  const width = window.innerWidth;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || (width >= 768 && width <= 1024)) {
    return "Tablet";
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua) || width < 768) {
    return "Mobile";
  }
  return "Desktop";
}

function detectBrowserAndOS() {
  if (typeof window === "undefined") return { browser: "Unknown", os: "Unknown" };
  const ua = navigator.userAgent;

  let browser = "Chrome";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";

  let os = "Windows";
  if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { browser, os };
}

export function UserTracker() {
  const pathname = usePathname();
  const pageStartTimeRef = useRef<number>(Date.now());
  const prevPathnameRef = useRef<string>(pathname);
  const sessionIdRef = useRef<string>("");
  const { user } = useUserStore();
  const lastTrackedClickRef = useRef<{ text: string; time: number }>({ text: "", time: 0 });
  const scrollMilestonesRef = useRef<Set<number>>(new Set());

  // 1. Heartbeat & Session Lifecycle
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    const { browser, os } = detectBrowserAndOS();
    const deviceType = detectDeviceType();

    // Initial heartbeat ping
    const sendInitialPing = () => {
      const payload = {
        sessionId: sessionIdRef.current,
        currentPage: pathname,
        deviceType,
        browser,
        os,
        userName: user?.name,
        userEmail: user?.email,
        userId: user?.id,
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pageDurationSeconds: 0,
      };

      fetch("/api/tracker/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify(payload),
      }).catch((e) => console.error("Tracker initial ping error:", e));
    };

    sendInitialPing();

    // Periodic heartbeat every 10 seconds
    const interval = setInterval(() => {
      const durationSeconds = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      const payload = {
        sessionId: sessionIdRef.current,
        currentPage: pathname,
        deviceType,
        browser,
        os,
        userName: user?.name,
        userEmail: user?.email,
        userId: user?.id,
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        pageDurationSeconds: durationSeconds,
      };

      fetch("/api/tracker/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  // 2. Track Route Changes
  useEffect(() => {
    if (prevPathnameRef.current === pathname) return;

    const previousPage = prevPathnameRef.current;
    const previousPageDuration = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);

    pageStartTimeRef.current = Date.now();
    prevPathnameRef.current = pathname;
    scrollMilestonesRef.current.clear();

    const { browser, os } = detectBrowserAndOS();
    const deviceType = detectDeviceType();

    const payload = {
      sessionId: sessionIdRef.current,
      currentPage: pathname,
      deviceType,
      browser,
      os,
      userName: user?.name,
      userEmail: user?.email,
      userId: user?.id,
      clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      previousPage,
      previousPageDuration,
      pageDurationSeconds: 0,
    };

    fetch("/api/tracker/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
      body: JSON.stringify(payload),
    }).catch(() => {});

    trackUserAction("NAVIGATE", `Navigated to ${pathname}`);
  }, [pathname]);

  // 3. Track Page Unload
  useEffect(() => {
    const handleUnload = () => {
      const previousPageDuration = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      const payload = JSON.stringify({
        sessionId: sessionIdRef.current,
        currentPage: pathname,
        previousPage: pathname,
        previousPageDuration,
        pageDurationSeconds: previousPageDuration,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/tracker/heartbeat", payload);
      } else {
        fetch("/api/tracker/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [pathname]);

  // 4. Global Smart Click & Tap Telemetry
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Find nearest button, link, or interactive element
      const interactiveEl = target.closest("button, a, input, select, textarea, [role='button'], [data-track]") as HTMLElement | null;
      if (!interactiveEl) return;

      // Skip internal admin tracker clicks to avoid feedback loops
      if (window.location.pathname.startsWith("/admin/live-tracker")) return;

      const tagName = interactiveEl.tagName.toLowerCase();
      let label = "";

      const ariaLabel = interactiveEl.getAttribute("aria-label") || interactiveEl.getAttribute("title");
      const textContent = interactiveEl.textContent?.trim().replace(/\s+/g, " ");

      if (ariaLabel) {
        label = ariaLabel;
      } else if (textContent && textContent.length < 80) {
        label = textContent;
      } else if (tagName === "input") {
        label = (interactiveEl as HTMLInputElement).placeholder || (interactiveEl as HTMLInputElement).name || "Search Field";
      }

      if (!label) return;

      // Debounce duplicate clicks within 600ms
      const now = Date.now();
      if (lastTrackedClickRef.current.text === label && now - lastTrackedClickRef.current.time < 600) {
        return;
      }
      lastTrackedClickRef.current = { text: label, time: now };

      const href = interactiveEl.getAttribute("href");
      if (href && (href.startsWith("/product/") || href.startsWith("/products/"))) {
        trackUserAction("PRODUCT_CLICK", `Viewed Product: "${label}" (${href})`);
      } else if (href && href.startsWith("/category/")) {
        trackUserAction("CATEGORY_CLICK", `Browsed Category: "${label}" (${href})`);
      } else if (href && (href.startsWith("tel:") || href.startsWith("mailto:") || href.includes("whatsapp.com"))) {
        trackUserAction("CONTACT_CLICK", `Clicked Contact Link: "${label}" (${href})`);
      } else if (tagName === "button" || interactiveEl.getAttribute("role") === "button") {
        trackUserAction("CLICK", `Clicked Button: "${label}"`);
      } else {
        trackUserAction("CLICK", `Clicked: "${label}"`);
      }
    };

    window.addEventListener("click", handleGlobalClick, { capture: true });
    return () => window.removeEventListener("click", handleGlobalClick, { capture: true });
  }, []);

  // 5. Scroll Depth Tracking (25%, 50%, 75%, 100%)
  useEffect(() => {
    let scrollTimer: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (scrollTimer) return;

      scrollTimer = setTimeout(() => {
        scrollTimer = null;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;

        const percent = Math.round((scrollTop / docHeight) * 100);
        const milestones = [25, 50, 75, 100];

        for (const milestone of milestones) {
          if (percent >= milestone && !scrollMilestonesRef.current.has(milestone)) {
            scrollMilestonesRef.current.add(milestone);
            trackUserAction("SCROLL_DEPTH", `Scrolled ${milestone}% of ${window.location.pathname}`);
          }
        }
      }, 500);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [pathname]);

  // 6. Throttled Hover / Product Card Attention Telemetry
  useEffect(() => {
    let hoverTimeout: NodeJS.Timeout | null = null;
    let currentHoverTarget: HTMLElement | null = null;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const card = target.closest(".group, [data-product-card], [data-vertical-card]") as HTMLElement | null;
      if (!card || card === currentHoverTarget) return;

      currentHoverTarget = card;
      if (hoverTimeout) clearTimeout(hoverTimeout);

      hoverTimeout = setTimeout(() => {
        const titleEl = card.querySelector("h3, h4, .type-product-title, .font-bold");
        const titleText = titleEl?.textContent?.trim().replace(/\s+/g, " ") || "";
        if (titleText && titleText.length > 2 && titleText.length < 80) {
          trackUserAction("HOVER_CARD", `Inspecting card: "${titleText}"`);
        }
      }, 1500);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && currentHoverTarget && !currentHoverTarget.contains(target)) {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        currentHoverTarget = null;
      }
    };

    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("mouseout", handleMouseOut, { passive: true });

    return () => {
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [pathname]);

  return null;
}
