"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/useToastStore";
import { Lock, Mail, ChevronRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [email, setEmail] = useState("a.miller@industrialmotion.com");
  const [password, setPassword] = useState("••••••••••••");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    addToast("success", "Welcome Back!", "Logged into Corporate Account.");
    router.push("/profile");
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen py-16 border-b border-slate-200 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-sky-400 flex items-center justify-center mx-auto shadow-md font-mono font-bold text-lg">
              P
            </div>
            <h1 className="text-2xl font-mono font-extrabold text-slate-900">
              Corporate Portal Sign In
            </h1>
            <p className="type-body-small text-slate-500">
              Access your Net-30 purchase orders, order tracking, and custom tier pricing.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold uppercase tracking-wider text-slate-500">Password</label>
                <Link href="/forgot-password" className="text-sky-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md transition-all"
            >
              Sign In to Account
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center type-body-small text-slate-500">
            Don&apos;t have a B2B corporate account yet?{" "}
            <Link href="/register" className="font-bold text-sky-600 hover:underline">
              Register Company Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
