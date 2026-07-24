"use client";

import { useState } from "react";
import Link from "next/link";
import { useToastStore } from "@/store/useToastStore";
import { ChevronRight, PhoneCall, Mail, MapPin, Sparkles, Send } from "lucide-react";

export default function ContactPage() {
  const { addToast } = useToastStore();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    addToast("success", "Message Logged", "Our application engineers will contact you shortly.");
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Contact Us</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900 mb-8">
          Contact Engineering & Support
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
              <h3 className="font-bold text-lg text-slate-900 font-mono flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-sky-600" /> Support Hotline
              </h3>
              <p className="text-xs text-slate-600">
                Direct phone line connection to certified industrial automation controls engineers.
              </p>
              <div className="type-card-title font-mono text-slate-900">1-800-555-AUTO</div>
              <div className="text-[10px] text-slate-400 font-mono">Available Monday - Friday, 24 Hours</div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
              <h3 className="font-bold text-lg text-slate-900 font-mono flex items-center gap-2">
                <Mail className="w-5 h-5 text-sky-600" /> B2B Procurement Email
              </h3>
              <p className="text-xs text-slate-600">
                Submit formal corporate purchase orders or requesting custom delivery terms.
              </p>
              <div className="text-sm font-bold font-mono text-sky-600">rfq@propelauto-industrial.com</div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
              <h3 className="font-bold text-lg text-slate-900 font-mono flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-600" /> Distribution Center
              </h3>
              <p className="text-xs text-slate-600">
                Central Logistics Hub: <br />
                100 Automation Parkway, Suite 400 <br />
                Chicago, IL 60601
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="type-product-title text-slate-900">Message Sent Successfully</h3>
                <p className="type-body-small text-slate-500 max-w-xs mx-auto">
                  Our application engineer will review your inquiry and reach back out within 2 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-sky-600" /> Send Technical Inquiry
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Your Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Corporate Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Inquiry Message</label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                    placeholder="Specify obsolete model number details or cross-referencing requests..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-slate-900 text-white type-button shadow-md"
                >
                  Send Inquiry to Engineering
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
