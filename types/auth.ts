export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  companyName?: string;
  image?: string | null;
  avatar?: string | null;
  googleSub?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  locale?: string | null;
  emailVerified?: boolean | string | null;
}

export interface GoogleAuthPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  aud?: string;
  iss?: string;
  exp?: number;
}

export interface GoogleSignInRequestBody {
  credential: string;
  returnUrl?: string;
}

export interface AuthApiResponse {
  success: boolean;
  user?: UserSession;
  error?: string;
  message?: string;
  returnUrl?: string;
}
