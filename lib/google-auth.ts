import { OAuth2Client } from "google-auth-library";
import { GoogleAuthPayload } from "@/types";

let oauthClientInstance: OAuth2Client | null = null;

function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in server environment variables.");
  }
  if (!oauthClientInstance) {
    oauthClientInstance = new OAuth2Client(clientId);
  }
  return oauthClientInstance;
}

/**
 * Cryptographically verify Google ID token received from the client
 * Ensures audience matches GOOGLE_CLIENT_ID, issuer is Google, and token has not expired.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleAuthPayload> {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Invalid or missing Google ID token.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google Client ID is not configured on the server.");
  }

  const client = getOAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Google authentication failed: empty token payload.");
  }

  // Verify Issuer
  const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
  if (!payload.iss || !validIssuers.includes(payload.iss)) {
    throw new Error("Google authentication failed: invalid token issuer.");
  }

  // Verify Expiration
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    throw new Error("Google authentication failed: token has expired.");
  }

  // Verify Subject & Email presence
  if (!payload.sub) {
    throw new Error("Google authentication failed: missing subject identifier (sub).");
  }

  if (!payload.email) {
    throw new Error("Google authentication failed: email address is required.");
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase().trim(),
    email_verified: Boolean(payload.email_verified),
    name: payload.name || payload.email.split("@")[0],
    picture: payload.picture,
    given_name: payload.given_name,
    family_name: payload.family_name,
    locale: (payload as any).locale,
    aud: typeof payload.aud === "string" ? payload.aud : clientId,
    iss: payload.iss,
    exp: payload.exp,
  };
}
