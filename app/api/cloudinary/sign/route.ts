import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdminApi } from "@/lib/auth-checks";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

import { cloudinarySignRequestSchema } from "@/lib/validations/cloudinary";

export async function POST(request: Request) {
  const authCheck = await requireAdminApi();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
    }

    const parsed = cloudinarySignRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Unauthorized signing parameters provided." },
        { status: 400 }
      );
    }

    const { paramsToSign } = parsed.data;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({ signature });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error signing request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
