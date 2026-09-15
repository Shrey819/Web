import { NextResponse } from "next/server";
import { getActiveProducts } from "@/lib/storefront";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCategory = searchParams.get("category");
    const rawSearch = searchParams.get("search");

    const category = rawCategory ? rawCategory.trim().slice(0, 100) : undefined;
    const search = rawSearch ? rawSearch.trim().slice(0, 100) : undefined;

    const products = await getActiveProducts(category, search);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json([], { status: 500 });
  }
}
