"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/useToastStore";
import { Building2, User, Mail, Lock } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    password: "",
    taxId: "",
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    addToast("success", "Registration Complete!", "B2B Account created successfully.");
    router.push("/profile");
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen py-16 border-b border-slate-200 flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-mono font-extrabold text-slate-900">
              Register B2B Account
            </h1>
            <p className="type-body-small text-slate-500">
              Set up corporate procurement terms and tax-exempt purchasing.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Full Name *</label>
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
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Company / Organization *</label>
              <input
                type="text"
                required
                placeholder="Apex Packaging Solutions"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Corporate Email *</label>
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
              <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Password *</label>
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
              className="w-full py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md transition-all"
            >
              Create B2B Account
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center type-body-small text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-sky-600 hover:underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
