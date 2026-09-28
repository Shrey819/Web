"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Mail, PhoneCall, MapPin, Award, CheckCircle2 } from "lucide-react";
import { CursorReflowText } from "@/components/ui/CursorReflowText";
import { FooterConfig, DEFAULT_FOOTER_CONFIG } from "@/lib/homepage";

const DEFAULT_SETTINGS = {
  support_phone: "+91 90993 92066",
  sub_contact_1_name: "Hiren Padia",
  sub_contact_1_phone: "+91 90993 92066",
  sub_contact_2_name: "Mahesh Pambhar",
  sub_contact_2_phone: "+91 99130 85220",
  sub_contact_3_name: "Dharmesh Pambhar",
  sub_contact_3_phone: "+91 94272 70113",
  sub_email_1: "omautomation2012@gmail.com",
  sub_email_2: "padiahiren24565@gmail.com",
};

export function Footer() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [activeChars, setActiveChars] = useState<Record<string, boolean>>({});

  const triggerCharEffect = (key: string) => {
    setActiveChars((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setActiveChars((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 1000);
  };

  const handleWordmarkTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const charId = target?.getAttribute("data-char-id");
    if (charId && !activeChars[charId]) {
      triggerCharEffect(charId);
    }
  };

  const triggerWaveEffect = () => {
    const allKeys = [
      ...Array.from("OM").map((_, i) => `om-${i}`),
      ...Array.from("AUTOMATION").map((_, i) => `auto-${i}`),
    ];
    allKeys.forEach((key, idx) => {
      setTimeout(() => {
        triggerCharEffect(key);
      }, idx * 55);
    });
  };

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setSettings({
            support_phone: data.support_phone || DEFAULT_SETTINGS.support_phone,
            sub_contact_1_name: data.sub_contact_1_name || DEFAULT_SETTINGS.sub_contact_1_name,
            sub_contact_1_phone: data.sub_contact_1_phone || DEFAULT_SETTINGS.sub_contact_1_phone,
            sub_contact_2_name: data.sub_contact_2_name || DEFAULT_SETTINGS.sub_contact_2_name,
            sub_contact_2_phone: data.sub_contact_2_phone || DEFAULT_SETTINGS.sub_contact_2_phone,
            sub_contact_3_name: data.sub_contact_3_name || DEFAULT_SETTINGS.sub_contact_3_name,
            sub_contact_3_phone: data.sub_contact_3_phone || DEFAULT_SETTINGS.sub_contact_3_phone,
            sub_email_1: data.sub_email_1 || DEFAULT_SETTINGS.sub_email_1,
            sub_email_2: data.sub_email_2 || DEFAULT_SETTINGS.sub_email_2,
          });
        }
      })
      .catch(() => {});

    fetch("/api/homepage", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.footerConfig) {
          setFooterConfig(data.footerConfig);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-200 border-t border-slate-900 pt-8 sm:pt-14 pb-8 sm:pb-12 overflow-hidden relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="content-shell relative z-10">
        {/* Top Newsletter & Catalogue Download Callout */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800 p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-xl mb-8 sm:mb-14 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full mb-2.5 border border-amber-500/20">
              <Award className="w-3.5 h-3.5" />
              {footerConfig.catalogBadge || "2026 Industrial Automation Catalog"}
            </span>
            <CursorReflowText
              as="h3"
              text={footerConfig.catalogTitle || "Download Full Product & Parts Catalog"}
              variant="heading"
              className="text-lg sm:text-2xl font-bold text-white mb-1.5"
            />
            <CursorReflowText
              as="p"
              text={
                footerConfig.catalogDesc ||
                "Get immediate offline access to 1,500+ CAD models, electrical schematics, and pricing for factory automation."
              }
              variant="body"
              className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed"
            />
          </div>

          <div className="lg:col-span-5 flex flex-col sm:flex-row gap-2.5">
            <input
              type="email"
              placeholder="Enter corporate email..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 active:border-amber-400 transition-colors"
              suppressHydrationWarning
            />
            <Link
              href={footerConfig.catalogCtaUrl || "/resources"}
              className="px-5 py-2.5 sm:py-3 rounded-full bg-amber-500 hover:bg-amber-400 active:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shrink-0 shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
              suppressHydrationWarning
            >
              <span>{footerConfig.catalogCtaText || "Download PDF"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Multi-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 sm:pb-14 border-b border-slate-800/80">
          {/* Column 1: Brand Info & Social Links */}
          <div className="lg:col-span-4 space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 active:scale-95 transition-transform duration-150"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-500 flex items-center justify-center font-black text-slate-950 text-base sm:text-lg shadow-md">
                OM
              </div>
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">
                OM <span className="text-amber-400">AUTOMATION</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
              Certified supplier of precision ballscrews, heavy-duty linear guideways, electric actuators, and factory automation components.
            </p>

            {/* Social Media Links */}
            <div className="pt-1">
              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5">
                Follow Us
              </h5>
              <div className="flex items-center gap-2.5">
                {/* Facebook */}
                {footerConfig.facebookUrl && (
                  <a
                    href={footerConfig.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-500/40 hover:bg-blue-500/10 active:scale-90 transition-all duration-150"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                )}
                {/* Instagram */}
                {footerConfig.instagramUrl && (
                  <a
                    href={footerConfig.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-pink-500 hover:border-pink-500/40 hover:bg-pink-500/10 active:scale-90 transition-all duration-150"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?phone=${(
                    footerConfig.whatsappNumber || settings.support_phone
                  ).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-emerald-500 hover:border-emerald-500/40 hover:bg-emerald-500/10 active:scale-90 transition-all duration-150"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.14 4.162 4.195-1.101z" />
                  </svg>
                </a>
                {/* YouTube */}
                {footerConfig.youtubeUrl && (
                  <a
                    href={footerConfig.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-500/40 hover:bg-red-500/10 active:scale-90 transition-all duration-150"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Links Section: Side-by-side on mobile (grid grid-cols-2) and separate columns on desktop */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4 sm:gap-6">
            {/* Useful Links */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-bold tracking-wider text-amber-400 uppercase">
                Useful Links
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {(footerConfig.usefulLinks && footerConfig.usefulLinks.length > 0
                  ? footerConfig.usefulLinks
                  : DEFAULT_FOOTER_CONFIG.usefulLinks
                ).map((lnk, idx) => (
                  <li key={idx}>
                    <Link
                      href={lnk.url}
                      className="inline-block py-0.5 text-slate-300 hover:text-amber-400 active:text-amber-400 transition-colors"
                    >
                      {lnk.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Links */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-bold tracking-wider text-amber-400 uppercase">
                Help & Policy
              </h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                {(footerConfig.helpLinks && footerConfig.helpLinks.length > 0
                  ? footerConfig.helpLinks
                  : DEFAULT_FOOTER_CONFIG.helpLinks
                ).map((lnk, idx) => (
                  <li key={idx}>
                    <Link
                      href={lnk.url}
                      className="inline-block py-0.5 text-slate-300 hover:text-amber-400 active:text-amber-400 transition-colors"
                    >
                      {lnk.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4: Contact Us Details */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold tracking-wider text-amber-400 uppercase">
              Contact Us
            </h4>

            <div className="space-y-3 text-xs sm:text-sm text-slate-200">
              {/* Address */}
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-slate-300">
                  {footerConfig.addressLine1 || "Shed No : C1B-271 R - Road,"}
                  <br />
                  {footerConfig.addressLine2 || "Aji GIDC, Rajkot - 360002."}
                </span>
              </div>

              {/* Sub Contacts Phone Lines */}
              <div className="flex items-start gap-2.5 pt-0.5">
                <PhoneCall className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>
                    <span className="text-slate-400">{settings.sub_contact_1_name}:</span>{" "}
                    <a
                      href={`tel:${settings.sub_contact_1_phone.replace(/\s+/g, "")}`}
                      className="font-semibold text-amber-400 hover:underline"
                    >
                      {settings.sub_contact_1_phone}
                    </a>
                  </p>
                  <p>
                    <span className="text-slate-400">{settings.sub_contact_2_name}:</span>{" "}
                    <a
                      href={`tel:${settings.sub_contact_2_phone.replace(/\s+/g, "")}`}
                      className="font-semibold text-amber-400 hover:underline"
                    >
                      {settings.sub_contact_2_phone}
                    </a>
                  </p>
                  <p>
                    <span className="text-slate-400">{settings.sub_contact_3_name}:</span>{" "}
                    <a
                      href={`tel:${settings.sub_contact_3_phone.replace(/\s+/g, "")}`}
                      className="font-semibold text-amber-400 hover:underline"
                    >
                      {settings.sub_contact_3_phone}
                    </a>
                  </p>
                </div>
              </div>

              {/* Sub Contact Emails */}
              <div className="flex items-start gap-2.5 pt-0.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>
                    <a
                      href={`mailto:${settings.sub_email_1}`}
                      className="text-slate-300 hover:text-amber-400 hover:underline"
                    >
                      {settings.sub_email_1}
                    </a>
                  </p>
                  <p>
                    <a
                      href={`mailto:${settings.sub_email_2}`}
                      className="text-slate-300 hover:text-amber-400 hover:underline"
                    >
                      {settings.sub_email_2}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Large Brand Wordmark Section - Interactive on click & touch for mobile and desktop */}
        <div
          className="py-6 sm:py-10 border-b border-slate-900 text-center overflow-hidden cursor-pointer"
          onTouchMove={handleWordmarkTouchMove}
          onClick={triggerWaveEffect}
        >
          <div className="text-3xl sm:text-5xl md:text-7xl lg:text-[7.5vw] font-black font-mono tracking-normal leading-none select-none flex justify-center items-center flex-wrap gap-x-4 sm:gap-x-8">
            <div className="flex gap-x-0.5 sm:gap-x-1">
              {Array.from("OM").map((char, i) => {
                const key = `om-${i}`;
                const isActive = !!activeChars[key];
                return (
                  <span
                    key={key}
                    data-char-id={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerCharEffect(key);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      triggerCharEffect(key);
                    }}
                    className={`cursor-pointer transition-all duration-300 inline-block touch-manipulation select-none ${
                      isActive
                        ? "text-white -translate-y-2.5 sm:-translate-y-4 scale-115 sm:scale-125 drop-shadow-[0_0_35px_rgba(255,255,255,0.95)]"
                        : "text-slate-800 hover:text-white hover:-translate-y-2.5 sm:hover:-translate-y-4 hover:scale-115 sm:hover:scale-125 hover:drop-shadow-[0_0_35px_rgba(255,255,255,0.95)] active:text-white active:-translate-y-2.5 active:scale-120 active:drop-shadow-[0_0_30px_rgba(255,255,255,0.95)]"
                    }`}
                  >
                    {char}
                  </span>
                );
              })}
            </div>

            <div className="flex gap-x-0.5 sm:gap-x-1">
              {Array.from("AUTOMATION").map((char, i) => {
                const key = `auto-${i}`;
                const isActive = !!activeChars[key];
                return (
                  <span
                    key={key}
                    data-char-id={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerCharEffect(key);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      triggerCharEffect(key);
                    }}
                    className={`cursor-pointer transition-all duration-300 inline-block touch-manipulation select-none ${
                      isActive
                        ? "text-amber-400 -translate-y-2.5 sm:-translate-y-4 scale-115 sm:scale-125 drop-shadow-[0_0_35px_rgba(251,191,36,0.95)]"
                        : "text-amber-500/20 hover:text-amber-400 hover:-translate-y-2.5 sm:hover:-translate-y-4 hover:scale-115 sm:hover:scale-125 hover:drop-shadow-[0_0_35px_rgba(251,191,36,0.95)] active:text-amber-400 active:-translate-y-2.5 active:scale-120 active:drop-shadow-[0_0_30px_rgba(251,191,36,0.95)]"
                    }`}
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-5 sm:pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 OM Automation. All rights reserved.</p>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secure Industrial Automation Store</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
