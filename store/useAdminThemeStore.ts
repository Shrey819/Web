import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminThemeState {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;
}

export const useAdminThemeStore = create<AdminThemeState>()(
  persist(
    (set) => ({
      theme: "light", // Default system theme is Light Mode
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
    }),
    {
      name: "admin-theme-storage",
    }
  )
);
