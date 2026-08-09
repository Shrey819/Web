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

export const useUserStore = create<UserStoreState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      login: (user) => set({ user, isLoggedIn: true }),
      logout: () => set({ user: null, isLoggedIn: false }),
    }),
    {
      name: "om-automation-user-session",
    }
  )
);
