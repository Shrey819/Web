import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product, ProductVariant } from "@/types";
import { trackUserAction } from "@/lib/trackerClient";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  appliedCoupon: string | null;
  discountPercent: number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant, buyerNote?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateBuyerNote: (itemId: string, buyerNote: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  syncLivePrices: () => Promise<void>;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

// Generate a unique ID for cart items to handle multiple variants or custom buyer notes of the same product
export const getCartItemId = (productId: string, variantId?: string, buyerNote?: string) => {
  const base = variantId ? `${productId}-${variantId}` : productId;
  return buyerNote && buyerNote.trim() ? `${base}__${buyerNote.trim()}` : base;
};

// Sanitize any price that was historically stored in paise (e.g. 20000 -> 200)
const sanitizeItemPrice = (item: CartItem): CartItem => {
  let prodPrice = item.product.basePrice || (item.product as any).price || 0;
  if (prodPrice >= 10000) {
    prodPrice = prodPrice / 100;
  }

  let varPrice = item.variant?.price;
  if (typeof varPrice === "number" && varPrice >= 10000) {
    varPrice = varPrice / 100;
  }

  return {
    ...item,
    buyerNote: item.buyerNote,
    product: {
      ...item.product,
      basePrice: prodPrice,
    },
    variant: item.variant
      ? {
          ...item.variant,
          price: varPrice ?? prodPrice,
        }
      : undefined,
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,
      discountPercent: 0,

      openCart: () => {
        set({ isOpen: true });
        get().syncLivePrices();
      },
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => {
        const nextState = !get().isOpen;
        set({ isOpen: nextState });
        if (nextState) get().syncLivePrices();
      },

      addItem: (product: Product, quantity = 1, variant?: ProductVariant, buyerNote?: string) => {
        trackUserAction("ADD_TO_CART", `Added ${quantity}x "${product.name}" to cart${buyerNote ? ` (Note: ${buyerNote})` : ""}`);
        
        let safeProdPrice = product.basePrice || (product as any).price || 0;
        if (safeProdPrice >= 10000) safeProdPrice = safeProdPrice / 100;

        let safeVarPrice = variant?.price;
        if (typeof safeVarPrice === "number" && safeVarPrice >= 10000) {
          safeVarPrice = safeVarPrice / 100;
        }

        const cleanProduct = { ...product, basePrice: safeProdPrice };
        const cleanVariant = variant ? { ...variant, price: safeVarPrice ?? safeProdPrice } : undefined;
        const cleanNote = buyerNote && buyerNote.trim() ? buyerNote.trim() : undefined;

        set((state) => {
          const itemId = getCartItemId(cleanProduct.id, cleanVariant?.id, cleanNote);
          const existingIndex = state.items.findIndex(
            (item) => getCartItemId(item.product.id, item.variant?.id, item.buyerNote) === itemId
          );

          let updatedItems: CartItem[];
          if (existingIndex > -1) {
            updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += quantity;
          } else {
            updatedItems = [...state.items, { product: cleanProduct, quantity, variant: cleanVariant, buyerNote: cleanNote }];
          }

          return { items: updatedItems, isOpen: true };
        });

        // Background live database sync
        get().syncLivePrices();
      },

      removeItem: (itemId: string) => {
        const itemToRemove = get().items.find((i) => getCartItemId(i.product.id, i.variant?.id, i.buyerNote) === itemId);
        if (itemToRemove) {
          trackUserAction("REMOVE_FROM_CART", `Removed "${itemToRemove.product.name}" from cart`);
        }
        set((state) => ({
          items: state.items.filter((item) => getCartItemId(item.product.id, item.variant?.id, item.buyerNote) !== itemId),
        }));
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            getCartItemId(item.product.id, item.variant?.id, item.buyerNote) === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      updateBuyerNote: (itemId: string, buyerNote: string) => {
        const clean = buyerNote.trim();
        set((state) => ({
          items: state.items.map((item) => {
            if (getCartItemId(item.product.id, item.variant?.id, item.buyerNote) === itemId) {
              return { ...item, buyerNote: clean || undefined };
            }
            return item;
          }),
        }));
      },

      clearCart: () => set({ items: [], appliedCoupon: null, discountPercent: 0 }),

      syncLivePrices: async () => {
        const currentItems = get().items;
        if (!currentItems || currentItems.length === 0) return;

        try {
          const res = await fetch("/api/cart/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: currentItems.map((item) => ({
                productId: item.product.id,
                variantId: item.variant?.id,
                quantity: item.quantity,
                product: item.product,
                variant: item.variant,
                buyerNote: item.buyerNote,
              })),
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.items)) {
              set({
                items: data.items.map((synced: any, idx: number) => ({
                  product: synced.product,
                  quantity: synced.quantity,
                  variant: synced.variant,
                  buyerNote: synced.buyerNote || currentItems[idx]?.buyerNote,
                })),
              });
            }
          }
        } catch (e) {
          console.warn("Could not sync live cart prices from DB:", e);
        }
      },

      applyCoupon: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        if (cleanCode === "INDUSTRIAL10" || cleanCode === "OM10" || cleanCode === "PROPEL10") {
          trackUserAction("APPLY_COUPON", `Applied promo code "${cleanCode}" (10% OFF)`);
          set({ appliedCoupon: cleanCode, discountPercent: 10 });
          return { success: true, message: "10% Industrial Discount Applied!" };
        } else if (cleanCode === "OM15" || cleanCode === "AUTOMATION15" || cleanCode === "PROPEL15") {
          trackUserAction("APPLY_COUPON", `Applied promo code "${cleanCode}" (15% OFF)`);
          set({ appliedCoupon: cleanCode, discountPercent: 15 });
          return { success: true, message: "15% Enterprise Automation Discount Applied!" };
        }
        return { success: false, message: "Invalid promo code. Try 'OM10'" };
      },

      removeCoupon: () => {
        const current = get().appliedCoupon;
        if (current) trackUserAction("REMOVE_COUPON", `Removed promo code "${current}"`);
        set({ appliedCoupon: null, discountPercent: 0 });
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => {
            const price = item.variant ? item.variant.price : item.product.basePrice;
            return sum + (price || 0) * item.quantity;
          },
          0
        );
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const discountPercent = get().discountPercent;
        return (subtotal * discountPercent) / 100;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        return Math.max(0, subtotal - discount);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "industrial-cart-storage",
      // Migrate stored items on load
      onRehydrateStorage: () => (state) => {
        if (state && state.items) {
          state.items = state.items.map(sanitizeItemPrice);
          state.syncLivePrices();
        }
      },
    }
  )
);
