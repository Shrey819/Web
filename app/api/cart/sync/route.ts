import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const productIds = Array.from(new Set(items.map((i: any) => i.productId || i.product?.id).filter(Boolean)));
    const variantIds = Array.from(new Set(items.map((i: any) => i.variantId || i.variant?.id).filter(Boolean)));

    const [prodRes, varRes] = await Promise.all([
      productIds.length > 0
        ? query(`SELECT id, slug, name, price, "basePrice", visible, status FROM "Product" WHERE id = ANY($1)`, [productIds])
        : { rows: [] },
      variantIds.length > 0
        ? query(`SELECT id, "productId", sku, price FROM "ProductVariant" WHERE id = ANY($1)`, [variantIds])
        : { rows: [] },
    ]);

    const productMap = new Map<string, any>();
    prodRes.rows.forEach((p) => {
      productMap.set(p.id, {
        id: p.id,
        slug: p.slug,
        name: p.name,
        basePrice: (p.price || p.basePrice || 0) / 100,
      });
    });

    const variantMap = new Map<string, any>();
    varRes.rows.forEach((v) => {
      variantMap.set(v.id, {
        id: v.id,
        sku: v.sku,
        price: (v.price || 0) / 100,
      });
    });

    const syncedItems = items.map((item: any) => {
      const prodId = item.productId || item.product?.id;
      const varId = item.variantId || item.variant?.id;

      const liveProd = productMap.get(prodId);
      const liveVar = varId ? variantMap.get(varId) : null;

      let verifiedPrice = liveProd ? liveProd.basePrice : 0;
      if (liveVar && typeof liveVar.price === "number") {
        verifiedPrice = liveVar.price;
      }

      return {
        ...item,
        product: {
          ...(item.product || {}),
          id: prodId,
          name: liveProd?.name || item.product?.name,
          basePrice: liveProd?.basePrice ?? (item.product?.basePrice > 1000 ? item.product.basePrice / 100 : item.product?.basePrice),
        },
        variant: item.variant
          ? {
              ...item.variant,
              price: liveVar?.price ?? (item.variant.price > 1000 ? item.variant.price / 100 : item.variant.price),
            }
          : undefined,
        verifiedPrice,
      };
    });

    return NextResponse.json({ success: true, items: syncedItems });
  } catch (error: any) {
    console.error("Cart price sync error:", error);
    return NextResponse.json({ error: error.message || "Failed to sync cart prices" }, { status: 500 });
  }
}
