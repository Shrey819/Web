import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
}

interface UserStoreState {
  user: UserSession | null;
  isLoggedIn: boolean;
  login: (user: UserSession) => void;
  logout: () => void;
}

import { trackUserAction } from "@/lib/trackerClient";

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: (user) => {
        trackUserAction("SIGN_IN", `User logged in as ${user.name} (${user.email})`);
        set({ user, isLoggedIn: true });
      },
      logout: () => {
        trackUserAction("SIGN_OUT", "User logged out");
        set({ user: null, isLoggedIn: false });
      },
    }),
    {
      name: "om-automation-user-session",
    }
  )
);
