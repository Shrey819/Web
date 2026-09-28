"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(prevState: string | undefined, formData: FormData) {
  try {
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const password = formData.get("password") as string;

    if (!email || !password) {
      return "Please enter both corporate email and password.";
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
        case "CallbackRouteError":
          return "Invalid email or password. Access is restricted to authorized administrators.";
        default:
          return "Authentication failed. Access is restricted to authorized administrators.";
      }
    }
    throw error;
  }
}
