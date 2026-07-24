import Link from "next/link";
import { RESOURCES } from "@/data/resources";
import { ChevronRight, Clock, User, ArrowRight } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Technical Resource Hub</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900">
            Automation Engineering Resources & Whitepapers
          </h1>
          <p className="type-body-small text-slate-500 mt-1">
            Deep dive calculations, commissioning tutorials, and industrial communication protocol guides.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {RESOURCES.map((art) => (
            <div
              key={art.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase">
                  <span className="text-sky-600 bg-sky-500/10 px-2.5 py-1 rounded-full">{art.category}</span>
                  <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {art.readTime}</span>
                </div>

                <Link href={`/resources/${art.slug}`}>
                  <h3 className="font-bold text-base text-slate-900 hover:text-sky-600 transition-colors line-clamp-2">
                    {art.title}
                  </h3>
                </Link>
                <p className="type-body-small text-slate-500 line-clamp-3">{art.summary}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs mt-6">
                <span className="text-slate-500 font-medium">{art.author}</span>
                <Link href={`/resources/${art.slug}`} className="font-bold text-sky-600 flex items-center gap-1">
                  Read Article <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
