import { NextResponse } from "next/server";
import { getActiveProducts } from "@/lib/storefront";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;

    const products = await getActiveProducts(category, search);
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json([], { status: 500 });
  }
}
