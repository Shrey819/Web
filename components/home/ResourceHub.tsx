"use client";

import Link from "next/link";
import { RESOURCES } from "@/data/resources";
import { BookOpen, ArrowRight, Clock, User } from "lucide-react";

export function ResourceHub() {
  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="content-shell">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 type-label text-sky-600 mb-2">
              <BookOpen className="w-4 h-4" />
              <span>Engineering Knowledge Base</span>
            </div>
            <h2 className="type-display-section text-slate-900">
              Latest Technical Resources & Selection Guides
            </h2>
          </div>

          <Link
            href="/resources"
            className="inline-flex items-center gap-2 type-button text-sky-600 hover:text-sky-700 transition-colors"
          >
            <span>View All Engineering Articles</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RESOURCES.map((res) => (
            <div
              key={res.id}
              className="group bg-slate-50 rounded-3xl p-6 border border-slate-200/80 hover:border-sky-500/40 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-sky-600 bg-sky-500/10 px-2.5 py-1 rounded-full uppercase">
                    {res.category}
                  </span>
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {res.readTime}
                  </span>
                </div>

                <Link href={`/resources/${res.slug}`}>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug">
                    {res.title}
                  </h3>
                </Link>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {res.summary}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>{res.author}</span>
                </div>

                <Link
                  href={`/resources/${res.slug}`}
                  className="font-bold text-sky-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1"
                >
                  Read <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
