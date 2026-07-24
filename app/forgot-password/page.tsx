"use client";

import { useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/store/useToastStore";
import { Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { addToast } = useToastStore();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    addToast("info", "Password Reset Link Sent", "Check your inbox for instructions.");
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen py-16 border-b border-slate-200 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-mono font-extrabold text-slate-900">
              Reset Your Password
            </h1>
            <p className="type-body-small text-slate-500">
              Enter your corporate email address to receive password recovery instructions.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-700">
                If an account exists for <strong>{email}</strong>, a recovery email has been sent with a secure password reset token.
              </p>
              <Link href="/login" className="inline-block px-6 py-2.5 rounded-full bg-slate-900 text-white type-button">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="a.miller@industrialmotion.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md transition-all"
              >
                Send Password Reset Email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
