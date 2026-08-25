"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FaqItem, DEFAULT_FAQS } from "@/lib/homepage";

interface FAQSectionProps {
  faqs?: FaqItem[];
  eyebrow?: string;
  title?: string;
}

export function FAQSection({ faqs, eyebrow, title }: FAQSectionProps) {
  const currentFaqs = faqs && faqs.length > 0 ? faqs : DEFAULT_FAQS;
  const [openFaqId, setOpenFaqId] = useState<string | null>(currentFaqs[0]?.id || "faq-1");

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <section className="py-20 bg-[#faf9f5] border-b border-slate-200">
      <div className="content-shell">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="inline-flex items-center gap-2 type-label text-amber-600 font-mono font-bold tracking-widest uppercase">
            <HelpCircle className="w-4 h-4" />
            <span>{eyebrow || "SUPPORT & HELP"}</span>
          </span>
          <h2 className="type-display-section text-slate-900">
            {title || "Frequently Asked Questions"}
          </h2>
          <p className="text-xs text-slate-600">
            Clear answers regarding technical support, dispatch cut-offs, B2B purchasing orders, and warranties.
          </p>
        </div>

        <div className="space-y-4">
          {currentFaqs.map((faq, idx) => {
            const faqId = faq.id || `faq-${idx}`;
            const isOpen = openFaqId === faqId;

            return (
              <div
                key={faqId}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faqId)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-sky-600 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                  suppressHydrationWarning
                >
                  <span className="flex-1">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-sky-600" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-5 pt-0 text-xs sm:text-sm text-slate-600 border-t border-slate-100 leading-relaxed font-mono">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 type-button text-sky-600 hover:text-sky-700 transition-colors"
          >
            <span>Have specific questions? Reach our applications team</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
