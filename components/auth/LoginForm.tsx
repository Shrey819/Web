"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/useToastStore";
import { useUserStore } from "@/store/useUserStore";
import { loginUserAction } from "@/app/actions/userAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Lock, Mail, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { sanitizeCallbackUrl, validateEmailAddress } from "@/lib/utils";

interface LoginFormProps {
  returnUrl?: string;
}

export function LoginForm({ returnUrl = "/profile" }: LoginFormProps) {
  const router = useRouter();
  const safeReturnUrl = sanitizeCallbackUrl(returnUrl, "/profile");

  const { addToast } = useToastStore();
  const { login } = useUserStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailBlur = () => {
    if (!email.trim()) return;
    const check = validateEmailAddress(email);
    if (!check.isValid) {
      setEmailError(check.error || "Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
    if (formError) setFormError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError("");
    if (formError) setFormError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setEmailError("");
    setPasswordError("");

    // Validate email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Account email is required.");
      return;
    }

    const emailCheck = validateEmailAddress(trimmedEmail);
    if (!emailCheck.isValid) {
      setEmailError(emailCheck.error || "Please enter a valid email address.");
      return;
    }

    // Validate password
    if (!password) {
      setPasswordError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginUserAction({ email: trimmedEmail, password });
      if (res.success && res.user) {
        login(res.user);
        addToast("success", "Welcome Back!", `Signed in as ${res.user.name}`);
        router.push(safeReturnUrl);
        router.refresh();
      } else {
        const errorMsg = res.error || "Invalid email or password. Please verify your credentials.";
        setFormError(errorMsg);
        addToast("error", "Sign In Failed", errorMsg);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = "An unexpected authentication error occurred. Please try again.";
      setFormError(errorMsg);
      addToast("error", "Error", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen py-6 sm:py-16 border-b border-slate-200 flex items-center justify-center">
      <div className="max-w-md w-full px-3.5 sm:px-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto shadow-md font-bold text-base sm:text-lg">
              OM
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Customer Sign In
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Sign in to view your orders, liked components, cart, and account profile.
            </p>
          </div>

          {/* Google One-Click Authentication */}
          <div className="space-y-3">
            <GoogleSignInButton returnUrl={safeReturnUrl} text="Continue with Google" />
            
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                OR
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>

          {/* Prominent Form Error Banner */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{formError}</div>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleLogin} noValidate className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block text-[11px]">
                Account Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 sm:top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                    emailError
                      ? "border-red-400 bg-red-50/20 focus:border-red-500"
                      : "border-slate-200 focus:border-sky-500 bg-white"
                  }`}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-[11px] text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold uppercase tracking-wider text-slate-500 text-[11px]">
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
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 sm:top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
                    passwordError
                      ? "border-red-400 bg-red-50/20 focus:border-red-500"
                      : "border-slate-200 focus:border-sky-500 bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 sm:top-3.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-[11px] text-red-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 sm:py-3.5 rounded-xl sm:rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

          <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            Don&apos;t have a customer account yet?{" "}
            <Link
              href={safeReturnUrl !== "/profile" ? `/register?returnUrl=${encodeURIComponent(safeReturnUrl)}` : "/register"}
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
