import { notFound } from "next/navigation";
import Link from "next/link";
import { RESOURCES } from "@/data/resources";
import { ChevronRight, Clock, User, ArrowLeft } from "lucide-react";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ResourceArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = RESOURCES.find((a) => a.slug === slug);

  if (!article) {
    return notFound();
  }

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/resources" className="hover:text-slate-900">
            Resources
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold truncate max-w-[200px]">{article.title}</span>
        </nav>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          <div className="space-y-4">
            <span className="inline-block text-[10px] font-mono font-bold uppercase text-sky-600 bg-sky-500/10 px-2.5 py-1 rounded-full">
              {article.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug font-mono">
              {article.title}
            </h1>

            <div className="flex items-center gap-4 type-body-small text-slate-400 font-mono">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> By {article.author} ({article.authorRole})</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {article.readTime}</span>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-100 pt-6">
            {article.content.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100">
            <Link href="/resources" className="inline-flex items-center gap-1.5 type-button text-sky-600 hover:text-sky-700">
              <ArrowLeft className="w-4 h-4" /> Back to all articles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
