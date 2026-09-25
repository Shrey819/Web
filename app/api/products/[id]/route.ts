import { NextResponse } from "next/server";
import { getProductForEdit, updateProduct, deleteProduct } from "@/app/actions/product";
import { requireAdminApi } from "@/lib/auth-checks";
import { requireValidOrigin } from "@/lib/csrf";
import { safeApiResponse } from "@/lib/safe-error";

import { idSchema } from "@/lib/validations/common";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdminApi();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  try {
    const { id } = await params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Invalid product ID format." }, { status: 400 });
    }

    const product = await getProductForEdit(parsedId.data);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    return safeApiResponse(error, "Failed to fetch product.", 500, "GetProduct");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originBlock = requireValidOrigin(request);
  if (originBlock) return originBlock;

  const authCheck = await requireAdminApi();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  try {
    const { id } = await params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Invalid product ID format." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON payload." }, { status: 400 });
    }

    const result = await updateProduct(parsedId.data, body as any);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to update product" }, { status: 400 });
    }
    return NextResponse.json({ success: true, id: parsedId.data });
  } catch (error) {
    return safeApiResponse(error, "Failed to update product.", 500, "UpdateProduct");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const originBlock = requireValidOrigin(request);
  if (originBlock) return originBlock;

  const authCheck = await requireAdminApi();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  try {
    const { id } = await params;
    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: "Invalid product ID format." }, { status: 400 });
    }

    const result = await deleteProduct(parsedId.data);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete product" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeApiResponse(error, "Failed to delete product.", 500, "DeleteProduct");
  }
}
