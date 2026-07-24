import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product, ProductVariant } from "@/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  appliedCoupon: string | null;
  discountPercent: number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

// Generate a unique ID for cart items to handle multiple variants of the same product
const getCartItemId = (productId: string, variantId?: string) => 
  variantId ? `${productId}-${variantId}` : productId;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,
      discountPercent: 0,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product: Product, quantity = 1, variant?: ProductVariant) => {
        set((state) => {
          const itemId = getCartItemId(product.id, variant?.id);
          const existingIndex = state.items.findIndex(
            (item) => getCartItemId(item.product.id, item.variant?.id) === itemId
          );

          let updatedItems: CartItem[];
          if (existingIndex > -1) {
            updatedItems = [...state.items];
            updatedItems[existingIndex].quantity += quantity;
          } else {
            updatedItems = [...state.items, { product, quantity, variant }];
          }

          return { items: updatedItems, isOpen: true };
        });
      },

      removeItem: (itemId: string) => {
        set((state) => ({
          items: state.items.filter((item) => getCartItemId(item.product.id, item.variant?.id) !== itemId),
        }));
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            getCartItemId(item.product.id, item.variant?.id) === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [], appliedCoupon: null, discountPercent: 0 }),

      applyCoupon: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        if (cleanCode === "INDUSTRIAL10" || cleanCode === "PROPEL10") {
          set({ appliedCoupon: cleanCode, discountPercent: 10 });
          return { success: true, message: "10% Industrial Discount Applied!" };
        } else if (cleanCode === "PROPEL15" || cleanCode === "AUTOMATION15") {
          set({ appliedCoupon: cleanCode, discountPercent: 15 });
          return { success: true, message: "15% Enterprise Automation Discount Applied!" };
        }
        return { success: false, message: "Invalid promo code. Try 'INDUSTRIAL10'" };
      },

      removeCoupon: () => set({ appliedCoupon: null, discountPercent: 0 }),

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => {
            const price = item.variant ? item.variant.price : item.product.basePrice;
            return sum + price * item.quantity;
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
    }
  )
);
