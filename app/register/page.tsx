"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToastStore } from "@/store/useToastStore";
import { useUserStore } from "@/store/useUserStore";
import { registerUserAction } from "@/app/actions/userAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Loader2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/profile";

  const { addToast } = useToastStore();
  const { login } = useUserStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    password: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      addToast("warning", "Input Required", "Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerUserAction({
        fullName: form.fullName,
        companyName: form.companyName,
        email: form.email,
        password: form.password,
      });

      if (res.success && res.user) {
        login(res.user);
        addToast("success", "Account Created!", `Welcome, ${res.user.name}`);
        router.push(returnUrl);
        router.refresh();
      } else {
        addToast("error", "Registration Failed", res.error || "Failed to create account.");
      }
    } catch (err) {
      console.error(err);
      addToast("error", "Error", "An unexpected error occurred during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen py-16 border-b border-slate-200 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-mono font-extrabold text-slate-900">
              Create Customer Account
            </h1>
            <p className="type-body-small text-slate-500">
              Set up your profile to track orders, save liked products, and maintain a shopping cart.
            </p>
          </div>

          {/* Google One-Click Registration */}
          <div className="space-y-3">
            <GoogleSignInButton returnUrl={returnUrl} text="Sign up with Google" />

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0">
                OR
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Sarah Jenkins"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                Company / Organization (Optional)
              </label>
              <input
                type="text"
                placeholder="Apex Packaging Solutions"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="s.jenkins@apex-packaging.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register with Email</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center type-body-small text-slate-500">
            Already have an account?{" "}
            <Link
              href={returnUrl !== "/profile" ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/login"}
              className="font-bold text-sky-600 hover:underline"
            >
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
