"use client";

import { useState } from "react";
import { FileText, Search, Edit3, X, Loader2, CheckCircle2, Building2, Phone, Mail } from "lucide-react";
import { updateQuoteStatusAction } from "@/app/actions/quote";

interface QuoteRow {
  id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
  createdAt: string;
  itemCount: number;
  items: any[];
}

export function AdminQuotesClient({ initialQuotes }: { initialQuotes: QuoteRow[] }) {
  const [quotes, setQuotes] = useState<QuoteRow[]>(initialQuotes);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingQuote, setEditingQuote] = useState<QuoteRow | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredQuotes = quotes.filter((q) => {
    if (statusFilter !== "all" && q.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      const matchId = q.id.toLowerCase().includes(term);
      const matchComp = q.company.toLowerCase().includes(term);
      const matchName = q.name.toLowerCase().includes(term);
      const matchEmail = q.email.toLowerCase().includes(term);
      if (!matchId && !matchComp && !matchName && !matchEmail) return false;
    }
    return true;
  });

  const handleOpenEdit = (q: QuoteRow) => {
    setEditingQuote(q);
    setNewStatus(q.status);
    setNewNotes(q.notes);
  };

  const handleSaveQuoteStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;

    setIsUpdating(true);
    try {
      const res = await updateQuoteStatusAction(editingQuote.id, newStatus, newNotes);
      if (res.success) {
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === editingQuote.id ? { ...q, status: newStatus, notes: newNotes } : q
          )
        );
        setEditingQuote(null);
      } else {
        alert(res.error || "Failed to update quote status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating quote");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search RFQ ID, company, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["all", "pending", "quoted", "accepted", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors uppercase whitespace-nowrap ${
                statusFilter === st
                  ? "bg-sky-500 text-slate-950 shadow-md"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* RFQ List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono">
                <th className="py-3.5 px-4">RFQ Ref & Date</th>
                <th className="py-3.5 px-4">Company & Contact</th>
                <th className="py-3.5 px-4">BOM / Requirements</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-mono">
                    No matching RFQ quote requests found in database.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-white">{q.id}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{q.company}</div>
                      <div className="text-[11px] text-slate-400">{q.name}</div>
                      <div className="text-[10px] text-slate-500">{q.email} • {q.phone}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="line-clamp-2 text-slate-300 font-mono text-[11px] leading-relaxed">
                        {q.notes || "Custom BOM Quotation Request"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border ${
                        q.status === "quoted" || q.status === "accepted" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        q.status === "pending" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {q.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(q)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-sky-600/20 text-slate-300 hover:text-sky-400 transition-colors inline-flex items-center gap-1 text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Manage RFQ</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit RFQ Modal */}
      {editingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-mono font-bold text-lg text-white">
                Manage RFQ #{editingQuote.id}
              </h3>
              <button onClick={() => setEditingQuote(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-white">{editingQuote.company} ({editingQuote.name})</div>
              <div className="text-slate-400">{editingQuote.email} • {editingQuote.phone}</div>
            </div>

            <form onSubmit={handleSaveQuoteStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-mono font-bold uppercase text-slate-400 block mb-1">RFQ Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-sky-500"
                >
                  <option value="pending">PENDING</option>
                  <option value="quoted">QUOTED</option>
                  <option value="accepted">ACCEPTED</option>
                  <option value="rejected">REJECTED</option>
                </select>
              </div>

              <div>
                <label className="font-mono font-bold uppercase text-slate-400 block mb-1">Engineering Notes / BOM Pricing Matrix</label>
                <textarea
                  rows={4}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Record custom pricing details, unit discounts, or follow-up notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQuote(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-2/3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save RFQ Updates"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
