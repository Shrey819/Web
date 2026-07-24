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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 pb-16 border-b border-slate-800/80">
          {/* Column 1: Brand Info */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-base">
                P
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white font-mono">
                PROPEL<span className="text-sky-400">AUTO</span>
              </span>
            </Link>
            <p className="type-body-small text-slate-400 leading-relaxed max-w-sm">
              Global distribution platform for factory automation, robotic sensing, PLCs, and heavy variable frequency drives. Engineered for maximum uptime and immediate B2B dispatch.
            </p>

            <div className="pt-2 space-y-3 type-body-small text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Industrial Logistics Hub, Tech Parkway, Suite 400</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Engineering Line: 1-800-555-AUTO (24/7 Support)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>rfq@propelauto-industrial.com</span>
              </div>
            </div>
          </div>

          {/* Column 2: Hardware Categories */}
          <div className="space-y-3">
            <h4 className="type-label text-white">
              Categories
            </h4>
            <ul className="space-y-3 type-body-small">
              <li>
                <Link href="/category/sensors" className="hover:text-sky-400 transition-colors">
                  Sensors & Perception
                </Link>
              </li>
              <li>
                <Link href="/category/plcs" className="hover:text-sky-400 transition-colors">
                  PLCs & Controllers
                </Link>
              </li>
              <li>
                <Link href="/category/drives" className="hover:text-sky-400 transition-colors">
                  Drives & Servo Motors
                </Link>
              </li>
              <li>
                <Link href="/products?sub=Inductive%20Proximity" className="hover:text-sky-400 transition-colors">
                  Inductive Proximity
                </Link>
              </li>
              <li>
                <Link href="/products?sub=Modular%20PLCs" className="hover:text-sky-400 transition-colors">
                  Modular PLCs
                </Link>
              </li>
              <li>
                <Link href="/products?sub=Variable%20Frequency%20Drives%20(VFD)" className="hover:text-sky-400 transition-colors">
                  Variable Frequency Drives
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Support */}
          <div className="space-y-3">
            <h4 className="type-label text-white">
              B2B Services
            </h4>
            <ul className="space-y-3 type-body-small">
              <li>
                <Link href="/quote" className="hover:text-sky-400 transition-colors">
                  Request Bulk RFQ
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-sky-400 transition-colors">
                  Spec Comparison Tool
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-sky-400 transition-colors">
                  Order Tracking & History
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-sky-400 transition-colors">
                  Corporate Account Portal
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-sky-400 transition-colors">
                  Technical FAQ & Warranties
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-sky-400 transition-colors">
                  Global Branch Locations
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company & Legal */}
          <div className="space-y-3">
            <h4 className="type-label text-white">
              Company
            </h4>
            <ul className="space-y-3 type-body-small">
              <li>
                <Link href="/about" className="hover:text-sky-400 transition-colors">
                  About Propel Automation
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-sky-400 transition-colors">
                  Engineering Resource Hub
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-sky-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-sky-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-sky-400 transition-colors">
                  Export Compliance (ITAR/EAR)
                </Link>
              </li>
            </ul>
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
