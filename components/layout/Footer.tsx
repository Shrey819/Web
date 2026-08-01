"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Mail, PhoneCall, MapPin, Award, CheckCircle2 } from "lucide-react";
import { CursorReflowText } from "@/components/ui/CursorReflowText";

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 pt-16 pb-12 overflow-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-sky-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="content-shell relative z-10">
        {/* Top Newsletter & Catalogue Download Callout */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800 p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 type-label text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full mb-3 border border-sky-500/20">
              <Award className="w-3.5 h-3.5" />
              2026 Industrial Hardware Catalog
            </span>
            <CursorReflowText
              as="h3"
              text="Download Full Industrial Parts Specification Book"
              variant="heading"
              className="type-section-title text-white mb-2"
            />
            <CursorReflowText
              as="p"
              text="Get immediate offline access to 1,500+ CAD models, electrical schematics, and volume pricing matrices for factory automation engineers."
              variant="body"
              className="type-body-large text-slate-300 max-w-xl"
            />
          </div>

          <div className="lg:col-span-5 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter corporate email..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-5 py-3.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={() => alert("2026 PDF Catalogue sent to your email address!")}
              className="px-6 py-3.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white type-button shrink-0 shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Download PDF</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-16 border-b border-slate-800/80">
          {/* Column 1: Brand Info & Social Links */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-500 flex items-center justify-center font-black text-slate-950 text-xl font-mono shadow-md">
                OM
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white font-mono">
                OM <span className="text-amber-400">AUTOMATION</span>
              </span>
            </Link>
            <p className="type-body-small text-slate-400 leading-relaxed max-w-sm">
              Wide range of industrial automation machinery products, PLCs, drives, sensors, and heavy factory automation components.
            </p>

            {/* Social Media Links */}
            <div className="pt-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">Follow Us</h5>
              <div className="flex items-center gap-3">
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/OMAUTOMATIONRAJKOT/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/om_automation_rajkot_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-pink-500 hover:border-pink-500/40 hover:bg-pink-500/10 transition-all"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* WhatsApp */}
                <a
                  href="https://api.whatsapp.com/send?phone=919099392066&app=facebook&entry_point=page_cta"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.14 4.162 4.195-1.101z"/>
                  </svg>
                </a>
                {/* YouTube */}
                <a
                  href="https://www.youtube.com/user/padiahir"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Useful Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="type-label text-amber-400 font-bold tracking-wider">
              Useful Links
            </h4>
            <ul className="space-y-3 type-body-small">
              <li>
                <Link href="/" className="hover:text-amber-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-amber-400 transition-colors">
                  Company
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-amber-400 transition-colors">
                  Brands & Products
                </Link>
              </li>
              <li>
                <Link href="/solutions" className="hover:text-amber-400 transition-colors">
                  Automation Solutions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-400 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Us Details */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="type-label text-amber-400 font-bold tracking-wider">
              Contact Us
            </h4>

            <div className="space-y-3 text-xs text-slate-300">
              {/* Address */}
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Shed No : C1B-271 R - Road,<br />
                  Aji GIDC, Rajkot.
                </span>
              </div>

              {/* Phone Lines */}
              <div className="flex items-start gap-3 pt-1">
                <PhoneCall className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>Hiren Padia : <a href="tel:+919099392066" className="font-semibold text-amber-400 hover:underline">(+91) 90993 92066</a></p>
                  <p>Mahesh Pambhar : <a href="tel:+919913085220" className="font-semibold text-amber-400 hover:underline">(+91) 99130 85220</a></p>
                  <p>Dharmesh Pambhar : <a href="tel:+919427270113" className="font-semibold text-amber-400 hover:underline">(+91) 94272 70113</a></p>
                </div>
              </div>

              {/* Emails */}
              <div className="flex items-start gap-3 pt-1">
                <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p><a href="mailto:omautomation2012@gmail.com" className="hover:text-amber-400 hover:underline">omautomation2012@gmail.com</a></p>
                  <p><a href="mailto:padiahiren24565@gmail.com" className="hover:text-amber-400 hover:underline">padiahiren24565@gmail.com</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Large Brand Wordmark Section */}
        <div className="py-10 border-b border-slate-900 text-center">
          <div className="text-[12vw] font-black tracking-tighter leading-none select-none font-mono flex justify-center">
            {Array.from("PROPEL.AUTO").map((char, i) => (
              <span
                key={i}
                className="text-slate-900 cursor-pointer transition-all duration-300 hover:text-slate-600 hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 hover:-translate-y-2"
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Copyright & B2B Payment Badges */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 type-caption text-slate-400">
          <p>© 2026 Propel Automation Inc. All rights reserved. All trademarks Siemens, Omron, ABB belong to respective owners.</p>

          <div className="flex items-center gap-4 type-technical text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Secure Corporate Checkout
            </span>
            <span>•</span>
            <span>Net-30 Invoice</span>
            <span>•</span>
            <span>Wire Transfer</span>
            <span>•</span>
            <span>P-Card Accepted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
