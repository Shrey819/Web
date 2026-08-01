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
                <MapPin className="w-5 h-5 text-amber-600" /> Factory Address
              </h3>
              <p className="text-sm font-mono text-slate-800 leading-relaxed">
                Shed No : C1B-271 R - Road,<br />
                Aji GIDC, Rajkot, Gujarat.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3">
              <h3 className="font-bold text-lg text-slate-900 font-mono flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-amber-600" /> Direct Phone Lines
              </h3>
              <div className="space-y-1.5 text-xs text-slate-700 font-mono">
                <p>Hiren Padia : <a href="tel:+919099392066" className="font-bold text-amber-600 hover:underline">(+91) 90993 92066</a></p>
                <p>Mahesh Pambhar : <a href="tel:+919913085220" className="font-bold text-amber-600 hover:underline">(+91) 99130 85220</a></p>
                <p>Dharmesh Pambhar : <a href="tel:+919427270113" className="font-bold text-amber-600 hover:underline">(+91) 94272 70113</a></p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3">
              <h3 className="font-bold text-lg text-slate-900 font-mono flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-600" /> Official Emails
              </h3>
              <div className="space-y-1 text-xs font-mono text-amber-600 font-bold">
                <p><a href="mailto:omautomation2012@gmail.com" className="hover:underline">omautomation2012@gmail.com</a></p>
                <p><a href="mailto:padiahiren24565@gmail.com" className="hover:underline">padiahiren24565@gmail.com</a></p>
              </div>
            </div>

            {/* Social Media Channels */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 font-mono">
                Follow Us On Social Media
              </h3>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="https://www.facebook.com/OMAUTOMATIONRAJKOT/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/om_automation_rajkot_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all shadow-sm"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://api.whatsapp.com/send?phone=919099392066&app=facebook&entry_point=page_cta"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.14 4.162 4.195-1.101z"/>
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/user/padiahir"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
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
