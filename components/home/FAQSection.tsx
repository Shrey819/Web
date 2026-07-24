"use client";

import { useState } from "react";
import Link from "next/link";
import { FAQS } from "@/data/faqs";
import { HelpCircle, ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function FAQSection() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQS[0].id);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <section className="py-20 bg-[#faf9f5] border-b border-slate-200">
      <div className="content-shell">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="inline-flex items-center gap-2 type-label text-sky-600">
            <HelpCircle className="w-4 h-4" />
            <span>Support & Guidance</span>
          </span>
          <h2 className="type-display-section text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-600">
            Clear answers regarding technical support, dispatch cut-offs, B2B purchasing orders, and warranties.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-sky-600 transition-colors"
                  aria-expanded={isOpen}
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
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/faq"
            className="inline-flex items-center gap-1.5 type-button text-sky-600 hover:text-sky-700 transition-colors"
          >
            <span>View Full Categorized Technical FAQ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
