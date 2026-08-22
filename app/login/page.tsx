"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToastStore } from "@/store/useToastStore";
import { useUserStore } from "@/store/useUserStore";
import { loginUserAction } from "@/app/actions/userAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Lock, Mail, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/profile";

  const { addToast } = useToastStore();
  const { login } = useUserStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast("warning", "Input Required", "Please enter email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginUserAction({ email, password });
      if (res.success && res.user) {
        login(res.user);
        addToast("success", "Welcome Back!", `Signed in as ${res.user.name}`);
        router.push(returnUrl);
        router.refresh();
      } else {
        addToast("error", "Sign In Failed", res.error || "Invalid login credentials.");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Error", "An unexpected authentication error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen py-16 border-b border-slate-200 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto shadow-md font-mono font-extrabold text-lg">
              OM
            </div>
            <h1 className="text-2xl font-mono font-extrabold text-slate-900">
              Customer Sign In
            </h1>
            <p className="type-body-small text-slate-500">
              Sign in to view your orders, liked components, cart, and account profile.
            </p>
          </div>

          {/* Google One-Click Authentication */}
          <div className="space-y-3">
            <GoogleSignInButton returnUrl={returnUrl} text="Continue with Google" />
            
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0">
                OR
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                Account Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold uppercase tracking-wider text-slate-500">
                  Password *
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-sky-600 hover:underline font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In with Email</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center type-body-small text-slate-500">
            Don&apos;t have a customer account yet?{" "}
            <Link
              href={returnUrl !== "/profile" ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : "/register"}
              className="font-bold text-sky-600 hover:underline"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
