import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product } from "@/types";

interface WishlistState {
  items: Product[];
  toggleWishlist: (product: Product) => boolean; // returns true if added, false if removed
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleWishlist: (product: Product) => {
        const exists = get().items.some((p) => p.id === product.id);
        if (exists) {
          set((state) => ({
            items: state.items.filter((p) => p.id !== product.id),
          }));
          return false;
        } else {
          set((state) => ({
            items: [...state.items, product],
          }));
          return true;
        }
      },
      isInWishlist: (productId: string) => {
        return get().items.some((p) => p.id === productId);
      },
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: "industrial-wishlist-storage",
    }
  )
);
