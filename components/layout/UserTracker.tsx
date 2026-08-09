"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

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

import { useUserStore } from "@/store/useUserStore";

export function UserTracker() {
  const pathname = usePathname();
  const pageStartTimeRef = useRef<number>(Date.now());
  const prevPathnameRef = useRef<string>(pathname);
  const sessionIdRef = useRef<string>("");
  const { user } = useUserStore();

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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  // Track Route Changes
  useEffect(() => {
    if (prevPathnameRef.current === pathname) return;

    const previousPage = prevPathnameRef.current;
    const previousPageDuration = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);

    pageStartTimeRef.current = Date.now();
    prevPathnameRef.current = pathname;

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [pathname]);

  // Track page unload / tab close
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

  return null;
}
