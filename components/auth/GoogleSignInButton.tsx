"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/useToastStore";
import { useUserStore } from "@/store/useUserStore";
import { Loader2 } from "lucide-react";

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: { credential?: string }) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: string;
  itp_support?: boolean;
}

interface GooglePromptNotification {
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
}

interface GoogleButtonOptions {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number | string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          prompt: (momentListener?: (moment: GooglePromptNotification) => void) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  text?: string;
  returnUrl?: string;
  className?: string;
}

export function GoogleSignInButton({
  text = "Continue with Google",
  returnUrl = "/profile",
  className = "",
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { login } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const buttonContainerRef = useRef<HTMLButtonElement>(null);
  const hiddenGisRef = useRef<HTMLDivElement>(null);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "555181150215-3s50i965naosp23bcpst9k1uun44eamd.apps.googleusercontent.com";

  // Handle verified Google credential from Google Identity Services
  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response?.credential) {
        addToast("error", "Google Sign-In Failed", "No credential returned from Google.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential: response.credential,
            returnUrl,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success && data.user) {
          login(data.user);
          addToast("success", "Welcome!", `Signed in as ${data.user.name}`);
          const destination = data.returnUrl || returnUrl || "/profile";
          router.push(destination);
          router.refresh();
        } else {
          const errorMsg = data.error || "Google authentication failed on the server.";
          addToast("error", "Sign In Failed", errorMsg);
        }
      } catch (err) {
        console.error("Google auth request error:", err);
        addToast("error", "Network Error", "Unable to connect to authentication server.");
      } finally {
        setIsLoading(false);
      }
    },
    [addToast, login, returnUrl, router]
  );

  useEffect(() => {
    if (!clientId) {
      console.warn("Google Client ID is missing.");
      return;
    }

    const scriptId = "google-gsi-client-script";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initializeGis = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: "signin",
            itp_support: true,
          });

          // Render hidden/native button to capture user clicks smoothly
          if (hiddenGisRef.current) {
            hiddenGisRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(hiddenGisRef.current, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "continue_with",
              shape: "pill",
              width: 380,
              logo_alignment: "left",
            });
          }
        } catch (e) {
          console.error("Failed to initialize Google Identity Services:", e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGis();
    } else if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGis();
      };
      script.onerror = () => {
        console.error("Failed to load Google Identity Services SDK.");
      };
      document.body.appendChild(script);
    } else {
      existingScript.addEventListener("load", initializeGis);
    }
  }, [clientId, handleCredentialResponse]);

  const handleCustomButtonClick = () => {
    if (isLoading) return;

    if (!clientId) {
      addToast("error", "Configuration Error", "Google Client ID is not configured.");
      return;
    }

    setIsLoading(true);

    if (window.google?.accounts?.id) {
      try {
        // Trigger Google Identity prompt/popup
        window.google.accounts.id.prompt((notification: GooglePromptNotification) => {
          if (notification.isNotDisplayed()) {
            console.log("GIS prompt not displayed:", notification.getNotDisplayedReason());
            // Fallback to clicking the hidden rendered GIS iframe button if One-Tap is suppressed
            const iframeBtn = hiddenGisRef.current?.querySelector("div[role=button]") as HTMLElement;
            if (iframeBtn) {
              iframeBtn.click();
            }
            setIsLoading(false);
          } else if (notification.isSkippedMoment()) {
            console.log("GIS prompt skipped:", notification.getSkippedReason());
            setIsLoading(false);
          } else if (notification.isDismissedMoment()) {
            console.log("GIS prompt dismissed:", notification.getDismissedReason());
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error("Error triggering Google prompt:", err);
        setIsLoading(false);
      }
    } else {
      addToast("warning", "Loading Google Services", "Google Sign-In is initializing. Please retry in a moment.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full relative">
      {/* Hidden GIS container for reliable native popup trigger */}
      <div
        ref={hiddenGisRef}
        className="absolute inset-0 opacity-0 pointer-events-auto z-10 overflow-hidden flex items-center justify-center cursor-pointer"
        style={{ height: "48px" }}
        aria-hidden="true"
        onClick={() => setIsLoading(true)}
      />

      {/* Styled Custom Button adhering to Brand & Theme */}
      <button
        ref={buttonContainerRef}
        type="button"
        onClick={handleCustomButtonClick}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span className="text-slate-600 font-medium">Signing in with Google...</span>
          </>
        ) : (
          <>
            {/* Official Google G Logo */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-bold text-slate-800">{text}</span>
          </>
        )}
      </button>
    </div>
  );
}
