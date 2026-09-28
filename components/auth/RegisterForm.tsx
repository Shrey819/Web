"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/useToastStore";
import { useUserStore } from "@/store/useUserStore";
import { registerUserAction } from "@/app/actions/userAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Loader2 } from "lucide-react";
import { sanitizeCallbackUrl, validatePersonName } from "@/lib/utils";

interface RegisterFormProps {
  returnUrl?: string;
}

export function RegisterForm({ returnUrl = "/profile" }: RegisterFormProps) {
  const router = useRouter();
  const safeReturnUrl = sanitizeCallbackUrl(returnUrl, "/profile");

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

    const nameCheck = validatePersonName(form.fullName);
    if (!nameCheck.isValid) {
      addToast("error", "Invalid Full Name", nameCheck.error || "Please enter a valid full name without special characters or numbers.");
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
        router.push(safeReturnUrl);
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
    <div className="bg-[#faf9f5] min-h-screen py-6 sm:py-16 border-b border-slate-200 flex items-center justify-center">
      <div className="max-w-md w-full px-3.5 sm:px-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-5">
          <div className="text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Create Customer Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Set up your profile to track orders, save liked products, and maintain a shopping cart.
            </p>
          </div>

          {/* Google One-Click Registration */}
          <div className="space-y-3">
            <GoogleSignInButton returnUrl={safeReturnUrl} text="Sign up with Google" />

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                OR
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold uppercase tracking-wider text-slate-500 block text-[11px]">
                  Full Name *
                </label>
                <span className="text-[10px] text-slate-400">Letters only</span>
              </div>
              <input
                type="text"
                required
                placeholder="Sarah Jenkins"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className={`w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border focus:outline-none transition-all ${
                  form.fullName.trim().length > 0 && !validatePersonName(form.fullName).isValid
                    ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                    : "border-slate-200 focus:border-sky-500"
                }`}
              />
              {form.fullName.trim().length > 0 && !validatePersonName(form.fullName).isValid && (
                <span className="text-[10px] text-rose-500 font-bold mt-1 block">
                  {validatePersonName(form.fullName).error}
                </span>
              )}
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block text-[11px]">
                Company / Organization (Optional)
              </label>
              <input
                type="text"
                placeholder="Apex Packaging Solutions"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block text-[11px]">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="s.jenkins@apex-packaging.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block text-[11px]">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 sm:py-3.5 rounded-xl sm:rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href={safeReturnUrl !== "/profile" ? `/login?returnUrl=${encodeURIComponent(safeReturnUrl)}` : "/login"}
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
