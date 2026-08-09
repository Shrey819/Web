/**
 * Client Utility for firing Telemetry Action Events to the server tracker
 */

export function trackUserAction(actionType: string, details: string) {
  if (typeof window === "undefined") return;

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
        userEmail = parsed.state.user.email;
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  const payload = JSON.stringify({
    sessionId,
    actionType,
    details,
    userName,
    userEmail,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/tracker/action", payload);
  } else {
    fetch("/api/tracker/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }
}
