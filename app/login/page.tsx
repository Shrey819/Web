import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOptionalAuthenticatedUser } from "@/lib/auth-checks";
import { sanitizeCallbackUrl } from "@/lib/utils";
import { LoginForm } from "@/components/auth/LoginForm";
import { Loader2 } from "lucide-react";

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const sp = await searchParams;
  const rawTarget =
    typeof sp?.callbackUrl === "string"
      ? sp.callbackUrl
      : typeof sp?.returnUrl === "string"
      ? sp.returnUrl
      : undefined;

  const safeTarget = sanitizeCallbackUrl(rawTarget, "/profile");

  // If user is already authenticated, redirect to destination immediately
  const existingUser = await getOptionalAuthenticatedUser();
  if (existingUser) {
    if (existingUser.role === "ADMIN" && safeTarget === "/profile") {
      redirect("/admin");
    }
    redirect(safeTarget);
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <LoginForm returnUrl={safeTarget} />
    </Suspense>
  );
}
