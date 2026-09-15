import "server-only";
import { query } from "@/lib/db";
import { getPrivateSystemSettings } from "@/lib/settings";

export interface CheckoutItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
  buyerNote?: string | null;
  name?: string;
  sku?: string;
  price?: number; // Client-submitted price: strictly IGNORED for security
}

export interface VerifiedOrderItem {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  unitPrice: number; // in Rupees (₹)
  unitPriceInPaise: number; // in Paise (integer)
  quantity: number;
  lineTotal: number; // in Rupees (₹): unitPrice * quantity
  buyerNote: string | null;
}

export interface ServerCheckoutCalculation {
  items: VerifiedOrderItem[];
  subtotal: number; // in Rupees (₹)
  discount: number; // in Rupees (₹)
  discountPercent: number;
  couponCode: string | null;
  tax: number; // in Rupees (₹) (18% GST)
  shippingCost: number; // in Rupees (₹) (0 for free standard shipping)
  total: number; // in Rupees (₹) (subtotal - discount + shippingCost)
  totalInPaise: number; // in Paise (integer: total * 100)
}

/**
 * Supported promo codes and corresponding discount percentages.
 * Evaluated strictly on the server to prevent client manipulation.
 */
const SUPPORTED_COUPONS: Record<string, number> = {
  OM10: 10,
  INDUSTRIAL10: 10,
  PROPEL10: 10,
  OM15: 15,
  AUTOMATION15: 15,
  PROPEL15: 15,
};

export interface CalculateCheckoutOptions {
  skipMinOrderCheck?: boolean;
}

/**
 * Reconstructs authoritative pricing for checkout items from PostgreSQL records.
 *
 * Security guarantees:
 * 1. Client prices, subtotals, discounts, and totals are completely ignored.
 * 2. Quantities are validated (positive integer, <= 1000).
 * 3. Products and variants are fetched from Neon PostgreSQL.
 * 4. Variant ownership is strictly verified (variant.productId === productId).
 * 5. Coupons are verified server-side against an authoritative whitelist.
 * 6. Minimum order value and maintenance mode settings are enforced.
 */
export async function calculateServerCheckout(
  rawItems: CheckoutItemInput[],
  rawCouponCode?: string | null,
  options?: CalculateCheckoutOptions
): Promise<ServerCheckoutCalculation> {
  if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("Cannot calculate order: Cart is empty.");
  }

  // 1. Fetch system settings
  const settings = await getPrivateSystemSettings();
  if (settings.maintenance_mode) {
    throw new Error("Store is currently undergoing scheduled maintenance. Order placement is paused.");
  }

  // 2. Validate quantities and extract IDs
  const productIds = new Set<string>();
  const variantIds = new Set<string>();

  for (let idx = 0; idx < rawItems.length; idx++) {
    const item = rawItems[idx];
    if (!item.productId || typeof item.productId !== "string" || item.productId.trim() === "") {
      throw new Error(`Item at position ${idx + 1} is missing a valid product ID.`);
    }

    const qty = item.quantity;
    if (
      typeof qty !== "number" ||
      !Number.isFinite(qty) ||
      !Number.isInteger(qty) ||
      qty <= 0 ||
      qty > 1000
    ) {
      throw new Error(`Invalid item quantity (${qty}). Quantity must be a whole number between 1 and 1,000.`);
    }

    productIds.add(item.productId.trim());

    if (item.variantId && typeof item.variantId === "string" && item.variantId.trim() !== "" && item.variantId !== "undefined" && item.variantId !== "null") {
      variantIds.add(item.variantId.trim());
    }
  }

  // 3. Query PostgreSQL for authoritative product and variant records
  const prodArray = Array.from(productIds);
  const varArray = Array.from(variantIds);

  const [prodRes, varRes] = await Promise.all([
    query(
      `SELECT id, name, sku, "basePrice", status, "quoteOnly"
       FROM "Product"
       WHERE id = ANY($1)`,
      [prodArray]
    ),
    varArray.length > 0
      ? query(
          `SELECT id, "productId", sku, price, status
           FROM "ProductVariant"
           WHERE id = ANY($1)`,
          [varArray]
        )
      : { rows: [] },
  ]);

  const productMap = new Map<string, any>();
  prodRes.rows.forEach((p) => productMap.set(p.id, p));

  const variantMap = new Map<string, any>();
  varRes.rows.forEach((v) => variantMap.set(v.id, v));

  // 4. Validate items and compute line items
  const verifiedItems: VerifiedOrderItem[] = [];

  for (const item of rawItems) {
    const cleanProdId = item.productId.trim();
    const product = productMap.get(cleanProdId);

    if (!product) {
      throw new Error(`Product ID "${cleanProdId}" does not exist or has been removed.`);
    }

    if (product.status && product.status.toLowerCase() === "draft") {
      throw new Error(`Product "${product.name}" is currently unavailable for order.`);
    }

    if (product.quoteOnly) {
      throw new Error(`Product "${product.name}" is quote-only and cannot be purchased directly through online checkout.`);
    }

    const cleanVarId =
      item.variantId && typeof item.variantId === "string" && item.variantId.trim() !== "" && item.variantId !== "undefined" && item.variantId !== "null"
        ? item.variantId.trim()
        : null;

    let unitPriceInPaise: number;
    let authoritativeSku: string;

    if (cleanVarId) {
      const variant = variantMap.get(cleanVarId);
      if (!variant) {
        throw new Error(`Product variant "${cleanVarId}" does not exist.`);
      }

      // Critical Security Check: Variant ownership validation (prevent variant-swap attack)
      if (variant.productId !== cleanProdId) {
        throw new Error(`Security validation failed: Variant "${cleanVarId}" does not belong to product "${cleanProdId}".`);
      }

      if (variant.status && variant.status.toLowerCase() === "inactive") {
        throw new Error(`Product variant "${variant.sku || cleanVarId}" is no longer active.`);
      }

      unitPriceInPaise = Number(variant.price);
      authoritativeSku = variant.sku || product.sku || `SKU-${cleanProdId}`;
    } else {
      unitPriceInPaise = Number(product.basePrice);
      authoritativeSku = product.sku || `SKU-${cleanProdId}`;
    }

    if (!Number.isFinite(unitPriceInPaise) || unitPriceInPaise < 0) {
      throw new Error(`Invalid price record for product "${product.name}".`);
    }

    // Convert from paise to Rupees (e.g. 250000 paise -> ₹2500)
    const unitPrice = Math.round(unitPriceInPaise / 100);
    const lineTotal = unitPrice * item.quantity;

    const cleanName = (item.name || product.name || "Industrial Hardware")
      .replace(/\s*-\s*undefined/gi, "")
      .replace(/\s*\(undefined\)/gi, "")
      .trim();

    verifiedItems.push({
      productId: cleanProdId,
      variantId: cleanVarId,
      name: cleanName,
      sku: authoritativeSku,
      unitPrice,
      unitPriceInPaise,
      quantity: item.quantity,
      lineTotal,
      buyerNote: item.buyerNote ? item.buyerNote.trim() : null,
    });
  }

  // 5. Calculate Subtotal
  const subtotal = verifiedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  // 6. Validate and apply coupon discount
  let discountPercent = 0;
  let appliedCouponCode: string | null = null;

  if (rawCouponCode && typeof rawCouponCode === "string" && rawCouponCode.trim() !== "") {
    const cleanCode = rawCouponCode.trim().toUpperCase();
    if (cleanCode in SUPPORTED_COUPONS) {
      discountPercent = SUPPORTED_COUPONS[cleanCode];
      appliedCouponCode = cleanCode;
    } else {
      throw new Error(`Invalid promo code "${rawCouponCode}". Please verify your coupon code.`);
    }
  }

  const discount = discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;

  // 7. Calculate Tax (GST) & Shipping
  const taxRate = typeof settings.tax_rate === "number" ? settings.tax_rate : 18;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * (taxRate / 100));
  const shippingCost = 0; // Free Standard Shipping across India

  // 8. Calculate Authoritative Final Total
  const total = Math.max(0, subtotal - discount + shippingCost);
  const totalInPaise = Math.round(total * 100);

  // 9. Enforce Minimum Order Value
  if (!options?.skipMinOrderCheck && settings.min_order_value > 0 && total < settings.min_order_value) {
    throw new Error(
      `Order total of ₹${total} does not meet the minimum required order amount of ₹${settings.min_order_value}.`
    );
  }

  return {
    items: verifiedItems,
    subtotal,
    discount,
    discountPercent,
    couponCode: appliedCouponCode,
    tax,
    shippingCost,
    total,
    totalInPaise,
  };
}
