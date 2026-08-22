import { NextResponse } from "next/server";
import { getProductForEdit, updateProduct, deleteProduct } from "@/app/actions/product";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductForEdit(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error: any) {
    console.error("GET product API error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await updateProduct(id, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to update product" }, { status: 400 });
    }
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("PUT product API error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteProduct(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete product" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE product API error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
