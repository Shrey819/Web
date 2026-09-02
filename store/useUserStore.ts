import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserSession } from "@/types";
import { trackUserAction } from "@/lib/trackerClient";

export type { UserSession };

interface UserStoreState {
  user: UserSession | null;
  isLoggedIn: boolean;
  isSyncing: boolean;
  login: (user: UserSession) => void;
  logout: () => Promise<void>;
  syncSession: () => Promise<UserSession | null>;
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isSyncing: false,

      login: (user) => {
        trackUserAction("SIGN_IN", `User logged in as ${user.name} (${user.email})`);
        set({ user, isLoggedIn: true });
      },

      logout: async () => {
        try {
          trackUserAction("SIGN_OUT", "User logged out");
          // Server-side invalidation
          await fetch("/api/auth/logout", { credentials: "same-origin", method: "POST" }).catch(() => {});
        } finally {
          set({ user: null, isLoggedIn: false });
        }
      },

      syncSession: async () => {
        try {
          set({ isSyncing: true });
          const res = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
          if (res.ok) {
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              const data = await res.json();
              if (data?.authenticated && data?.user) {
                set({ user: data.user, isLoggedIn: true, isSyncing: false });
                return data.user;
              }
            }
          }
          // If server reports unauthenticated, clear local state
          set({ user: null, isLoggedIn: false, isSyncing: false });
          return null;
        } catch (error) {
          console.error("Session sync failed:", error);
          set({ isSyncing: false });
          return get().user;
        }
      },
    }),
    {
      name: "om-automation-user-session",
    }
  )
);
