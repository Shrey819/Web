/**
 * Client Utility for firing Telemetry Action Events to the server tracker
 */

import { isSensitivePath, maskEmail } from "@/lib/tracker-utils";

export function trackUserAction(actionType: string, details: string) {
  if (typeof window === "undefined") return;

  // Exclude sensitive routes from tracking
  const currentPath = window.location.pathname;
  if (isSensitivePath(currentPath)) return;

  const sessionId = localStorage.getItem("om_user_session_id");
  if (!sessionId) return;

  let userName: string | undefined = undefined;
  let userEmail: string | undefined = undefined;

  try {
    const userStore = localStorage.getItem("om-user-storage");
    if (userStore) {
      const parsed = JSON.parse(userStore);
      if (parsed.state?.user) {
        userName = parsed.state.user.name;
        // Never send unmasked raw email
        if (parsed.state.user.email) {
          userEmail = maskEmail(parsed.state.user.email);
        }
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  // Strip query strings from details and limit length
  const cleanDetails = (details || "")
    .replace(/\?[^ "')\]]+/g, "")
    .replace(/<[^>]*>/g, "")
    .slice(0, 255);

  const payload = JSON.stringify({
    sessionId,
    actionType,
    details: cleanDetails,
    userName,
    userEmail,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/tracker/action", payload);
  } else {
    fetch("/api/tracker/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420",
      },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}
