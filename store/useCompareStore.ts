import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

interface CompareState {
  items: Product[];
  toggleCompare: (product: Product) => { added: boolean; limitReached?: boolean };
  removeItem: (productId: string) => void;
  isInCompare: (productId: string) => boolean;
  clearCompare: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleCompare: (product: Product) => {
        const exists = get().items.some((p) => p.id === product.id);
        if (exists) {
          set((state) => ({
            items: state.items.filter((p) => p.id !== product.id),
          }));
          return { added: false };
        } else {
          if (get().items.length >= 4) {
            return { added: false, limitReached: true };
          }
          set((state) => ({
            items: [...state.items, product],
          }));
          return { added: true };
        }
      },
      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((p) => p.id !== productId),
        }));
      },
      isInCompare: (productId: string) => {
        return get().items.some((p) => p.id === productId);
      },
      clearCompare: () => set({ items: [] }),
    }),
    {
      name: "industrial-compare-storage",
    }
  )
);
