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
      theme: "dark", // Current default system theme is Dark Mode
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
    }),
    {
      name: "admin-theme-storage",
    }
  )
);
