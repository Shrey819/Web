import { NextResponse } from "next/server";
import { verifyGoogleIdToken } from "@/lib/google-auth";
import { createSession } from "@/lib/session";
import { query } from "@/lib/db";
import crypto from "crypto";

const generateId = (prefix: string) => prefix + "_" + crypto.randomBytes(8).toString("hex");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { credential, returnUrl } = body || {};

    if (!credential || typeof credential !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing Google ID token credential." },
        { status: 400 }
      );
    }

    // 1. Cryptographically verify Google ID Token with Google's public certificates
    let payload;
    try {
      payload = await verifyGoogleIdToken(credential);
    } catch (verifyError) {
      console.error("Google token verification failed:", verifyError);
      const errorMsg = verifyError instanceof Error ? verifyError.message : "Token verification failed";
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 401 }
      );
    }

    const { sub, email, email_verified, name, picture, given_name, family_name, locale } = payload;
    let userId: string;
    let userRole = "CUSTOMER";
    let userName = name;
    let userImage = picture || null;
    let userGivenName = given_name || null;
    let userFamilyName = family_name || null;
    let userLocale = locale || null;
    const userEmailVerified = email_verified ? new Date() : null;

    // 2. Check if user already exists by google_sub
    const existingGoogleUserRes = await query(
      `SELECT id, name, email, role, image, avatar, google_sub, given_name, family_name, locale, "emailVerified" 
       FROM "User" 
       WHERE google_sub = $1 
       LIMIT 1`,
      [sub]
    );

    if (existingGoogleUserRes.rows.length > 0) {
      // Existing Google-authenticated user
      const existingUser = existingGoogleUserRes.rows[0];
      userId = existingUser.id;
      userRole = existingUser.role || "CUSTOMER";
      userName = existingUser.name || name;
      userImage = existingUser.image || existingUser.avatar || picture || null;
      userGivenName = existingUser.given_name || given_name || null;
      userFamilyName = existingUser.family_name || family_name || null;
      userLocale = existingUser.locale || locale || null;

      // Update avatar, names, and locale
      await query(
        `UPDATE "User" 
         SET 
           "image" = COALESCE($1, "image"),
           "avatar" = COALESCE($1, "avatar"),
           "name" = COALESCE($2, "name"),
           "given_name" = COALESCE($3, "given_name"),
           "family_name" = COALESCE($4, "family_name"),
           "locale" = COALESCE($5, "locale"),
           "updatedAt" = CURRENT_TIMESTAMP 
         WHERE id = $6`,
        [picture || null, name, given_name || null, family_name || null, locale || null, userId]
      );

      // Ensure Account entry exists
      const accountId = generateId("acc");
      await query(
        `INSERT INTO "Account" ("id", "userId", "type", "provider", "providerAccountId", "token_type", "scope")
         VALUES ($1, $2, 'oauth', 'google', $3, 'Bearer', 'email profile openid')
         ON CONFLICT ("provider", "providerAccountId") DO UPDATE SET "userId" = $2`,
        [accountId, userId, sub]
      );
    } else {
      // 3. Check if user already exists by email (Existing Email/Password User)
      const existingEmailUserRes = await query(
        `SELECT id, name, email, role, image, avatar, google_sub, given_name, family_name, locale, "emailVerified" 
         FROM "User" 
         WHERE email = $1 
         LIMIT 1`,
        [email]
      );

      if (existingEmailUserRes.rows.length > 0) {
        // Secure Account Linking:
        // Google has verified that the user owns this email address
        if (!email_verified) {
          return NextResponse.json(
            { 
              success: false, 
              error: "Google email is not verified. Please verify your Google email or sign in with your password." 
            },
            { status: 400 }
          );
        }

        const existingUser = existingEmailUserRes.rows[0];
        userId = existingUser.id;
        userRole = existingUser.role || "CUSTOMER";
        userName = existingUser.name || name;
        userImage = existingUser.image || existingUser.avatar || picture || null;
        userGivenName = existingUser.given_name || given_name || null;
        userFamilyName = existingUser.family_name || family_name || null;
        userLocale = existingUser.locale || locale || null;

        // Link Google identity to existing user account preserving password and all associated data
        await query(
          `UPDATE "User" 
           SET 
             "google_sub" = $1,
             "image" = COALESCE("image", $2),
             "avatar" = COALESCE("avatar", $2),
             "name" = COALESCE("name", $3),
             "given_name" = COALESCE("given_name", $4),
             "family_name" = COALESCE("family_name", $5),
             "locale" = COALESCE("locale", $6),
             "emailVerified" = COALESCE("emailVerified", CURRENT_TIMESTAMP),
             "updatedAt" = CURRENT_TIMESTAMP 
           WHERE id = $7`,
          [sub, picture || null, name, given_name || null, family_name || null, locale || null, userId]
        );

        // Record provider link in Account table
        const accountId = generateId("acc");
        await query(
          `INSERT INTO "Account" ("id", "userId", "type", "provider", "providerAccountId", "token_type", "scope")
           VALUES ($1, $2, 'oauth', 'google', $3, 'Bearer', 'email profile openid')
           ON CONFLICT ("provider", "providerAccountId") DO UPDATE SET "userId" = $2`,
          [accountId, userId, sub]
        );
      } else {
        // 4. Brand New User Creation
        userId = generateId("usr");
        const accountId = generateId("acc");

        await query(
          `INSERT INTO "User" (
             "id", "name", "email", "image", "avatar", "google_sub", "given_name", "family_name", "locale", "emailVerified", "role", "createdAt", "updatedAt"
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            userId,
            name,
            email,
            picture || null,
            picture || null,
            sub,
            given_name || null,
            family_name || null,
            locale || null,
            email_verified ? new Date() : null,
          ]
        );

        await query(
          `INSERT INTO "Account" ("id", "userId", "type", "provider", "providerAccountId", "token_type", "scope")
           VALUES ($1, $2, 'oauth', 'google', $3, 'Bearer', 'email profile openid')
           ON CONFLICT ("provider", "providerAccountId") DO UPDATE SET "userId" = $2`,
          [accountId, userId, sub]
        );
      }
    }

    // 5. Create secure server-side authenticated session & set HttpOnly cookie
    await createSession(userId);

    const safeUser = {
      id: userId,
      name: userName,
      email: email,
      role: userRole,
      image: userImage,
      avatar: userImage,
      googleSub: sub,
      givenName: userGivenName,
      familyName: userFamilyName,
      locale: userLocale,
      emailVerified: userEmailVerified,
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
      returnUrl: returnUrl || "/profile",
      message: "Successfully authenticated with Google.",
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during Google sign-in." },
      { status: 500 }
    );
  }
}
