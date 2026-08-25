"use client";

import { useState, useEffect } from "react";
import {
  getFormSubmissionsAction,
  updateFormSubmissionAction,
  deleteFormSubmissionAction,
  FormSubmissionRecord,
} from "@/app/actions/forms";
import { useToastStore } from "@/store/useToastStore";
import {
  FileSpreadsheet,
  Download,
  Trash2,
  Edit2,
  Check,
  X,
  Mail,
  Search,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Eye,
  Copy,
  ExternalLink,
} from "lucide-react";

export function AdminFormsManager() {
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<"inquiry" | "promotional">("inquiry");
  const [submissions, setSubmissions] = useState<FormSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for Viewing Full Submission Record
  const [viewingSubmission, setViewingSubmission] = useState<FormSubmissionRecord | null>(null);

  // Cell Inline Editing State: { rowId, field }
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: "name" | "email" | "category" | "message" | "status";
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSavingCell, setIsSavingCell] = useState(false);

  // Load submissions whenever activeTab changes
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getFormSubmissionsAction(activeTab);
      if (res.success) {
        setSubmissions(res.submissions);
      } else {
        addToast("error", "Error", "Failed to fetch form submissions.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Start cell editing
  const startEditing = (
    id: string,
    field: "name" | "email" | "category" | "message" | "status",
    currentVal: string
  ) => {
    setEditingCell({ id, field });
    setEditValue(currentVal || "");
  };

  // Save edited cell to PostgreSQL DB
  const saveCell = async () => {
    if (!editingCell) return;
    setIsSavingCell(true);

    try {
      const res = await updateFormSubmissionAction(
        editingCell.id,
        editingCell.field,
        editValue
      );
      if (res.success) {
        addToast("success", "Cell Updated", `Updated ${editingCell.field} successfully.`);
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === editingCell.id ? { ...s, [editingCell.field]: editValue } : s
          )
        );
        if (viewingSubmission && viewingSubmission.id === editingCell.id) {
          setViewingSubmission((prev) =>
            prev ? { ...prev, [editingCell.field]: editValue } : null
          );
        }
        setEditingCell(null);
      } else {
        addToast("error", "Update Failed", res.error || "Could not update cell.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "An error occurred.");
    } finally {
      setIsSavingCell(false);
    }
  };

  // Delete row from PostgreSQL DB
  const handleDeleteRow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this form submission row?")) return;

    try {
      const res = await deleteFormSubmissionAction(id);
      if (res.success) {
        addToast("success", "Row Deleted", "Submission row removed successfully.");
        setSubmissions((prev) => prev.filter((s) => s.id !== id));
        if (viewingSubmission?.id === id) {
          setViewingSubmission(null);
        }
      } else {
        addToast("error", "Delete Failed", res.error || "Could not delete row.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "Failed to delete.");
    }
  };

  // Export Table to Excel / CSV format
  const exportToCSV = () => {
    if (submissions.length === 0) {
      addToast("error", "Export Empty", "No data rows available to export.");
      return;
    }

    const headers =
      activeTab === "inquiry"
        ? ["ID", "Name", "Email", "Topic/Category", "Message", "Status", "Date"]
        : ["ID", "Email", "Category", "Status", "Date"];

    const rows = submissions.map((s) =>
      activeTab === "inquiry"
        ? [
            s.id,
            `"${(s.name || "").replace(/"/g, '""')}"`,
            `"${s.email.replace(/"/g, '""')}"`,
            `"${(s.category || "").replace(/"/g, '""')}"`,
            `"${(s.message || "").replace(/"/g, '""')}"`,
            s.status,
            s.createdAt,
          ]
        : [
            s.id,
            `"${s.email.replace(/"/g, '""')}"`,
            `"${(s.category || "").replace(/"/g, '""')}"`,
            s.status,
            s.createdAt,
          ]
    );

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `om_automation_${activeTab}_submissions_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast("success", "Export Complete", `Exported ${submissions.length} rows to Excel/CSV.`);
  };

  // Filtered rows
  const filteredSubmissions = searchQuery.trim()
    ? submissions.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
          s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.message && s.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : submissions;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-mono">
            <FileSpreadsheet className="w-6 h-6 text-amber-500" />
            Forms & Submissions Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access, view, edit cell data, click ID to read full message, and export all submissions in Excel format.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg text-xs flex items-center gap-1.5 font-medium transition-colors cursor-pointer shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer font-mono"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("inquiry")}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "inquiry"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Form 1: Inquiry Messages</span>
        </button>

        <button
          onClick={() => setActiveTab("promotional")}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "promotional"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Form 2: Promotional Newsletter</span>
        </button>
      </div>

      {/* Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search cells by name, email, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          Showing <strong className="text-slate-900 dark:text-white">{filteredSubmissions.length}</strong> {activeTab} rows (Click ID to read full message)
        </div>
      </div>

      {/* Excel-Style Editable Table Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-32">ID (Click to Read)</th>
                {activeTab === "inquiry" && <th className="py-3 px-4 w-40">Name</th>}
                <th className="py-3 px-4 w-52">Email</th>
                <th className="py-3 px-4 w-44">Category / Topic</th>
                {activeTab === "inquiry" && <th className="py-3 px-4">Message Details</th>}
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4 w-36">Submitted At</th>
                <th className="py-3 px-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading form submissions...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    No submission rows found.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    {/* ID (Clicking ID opens detail modal to read full message) */}
                    <td className="py-3 px-4 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-bold">
                      <button
                        onClick={() => setViewingSubmission(row)}
                        className="hover:underline flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                        title="Click to read full message"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{row.id.substring(0, 10)}...</span>
                      </button>
                    </td>

                    {/* Name (Editable Cell) */}
                    {activeTab === "inquiry" && (
                      <td className="py-3 px-4">
                        {editingCell?.id === row.id && editingCell.field === "name" ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="bg-white dark:bg-slate-900 border border-blue-500 text-slate-900 dark:text-slate-100 rounded px-2 py-1 text-xs w-full font-mono focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={saveCell}
                              disabled={isSavingCell}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startEditing(row.id, "name", row.name || "")}
                            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded flex items-center justify-between group/cell transition-colors"
                            title="Click to edit Name cell"
                          >
                            <span className="font-bold text-slate-900 dark:text-white">{row.name || "N/A"}</span>
                            <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover/cell:opacity-100" />
                          </div>
                        )}
                      </td>
                    )}

                    {/* Email (Editable Cell) */}
                    <td className="py-3 px-4">
                      {editingCell?.id === row.id && editingCell.field === "email" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="email"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-blue-500 text-slate-900 dark:text-slate-100 rounded px-2 py-1 text-xs w-full font-mono focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={saveCell}
                            disabled={isSavingCell}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingCell(null)}
                            className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditing(row.id, "email", row.email)}
                          className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded flex items-center justify-between group/cell transition-colors"
                          title="Click to edit Email cell"
                        >
                          <span className="text-blue-600 dark:text-blue-400 underline">{row.email}</span>
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover/cell:opacity-100" />
                        </div>
                      )}
                    </td>

                    {/* Category (Editable Cell) */}
                    <td className="py-3 px-4">
                      {editingCell?.id === row.id && editingCell.field === "category" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-blue-500 text-slate-900 dark:text-slate-100 rounded px-2 py-1 text-xs w-full font-mono focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={saveCell}
                            disabled={isSavingCell}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingCell(null)}
                            className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditing(row.id, "category", row.category || "")}
                          className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded flex items-center justify-between group/cell transition-colors"
                          title="Click to edit Category cell"
                        >
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {row.category || "General"}
                          </span>
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover/cell:opacity-100" />
                        </div>
                      )}
                    </td>

                    {/* Message Details */}
                    {activeTab === "inquiry" && (
                      <td className="py-3 px-4">
                        <div
                          onClick={() => setViewingSubmission(row)}
                          className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded flex items-center justify-between group/cell max-w-xs sm:max-w-md truncate transition-colors"
                          title="Click to read full message"
                        >
                          <span className="truncate text-slate-600 dark:text-slate-400">{row.message || "N/A"}</span>
                          <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 opacity-0 group-hover/cell:opacity-100 shrink-0" />
                        </div>
                      </td>
                    )}

                    {/* Status (Editable Dropdown Cell) */}
                    <td className="py-3 px-4">
                      {editingCell?.id === row.id && editingCell.field === "status" ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-blue-500 text-slate-900 dark:text-slate-100 rounded px-2 py-1 text-xs font-mono focus:outline-none"
                          >
                            <option value="unread">unread</option>
                            <option value="read">read</option>
                            <option value="archived">archived</option>
                          </select>
                          <button
                            onClick={saveCell}
                            disabled={isSavingCell}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditing(row.id, "status", row.status)}
                          className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded inline-block transition-colors"
                          title="Click to edit Status cell"
                        >
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                              row.status === "read"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                                : row.status === "archived"
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                                : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                            }`}
                          >
                            {row.status}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Submitted At */}
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(row.createdAt).toLocaleDateString()} {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Row Actions */}
                    <td className="py-3 px-4 text-right flex items-center justify-end gap-1">
                      <button
                        onClick={() => setViewingSubmission(row)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                        title="Read Full Message"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL MESSAGE DETAIL MODAL (Triggered when clicking ID or Eye icon) */}
      {viewingSubmission && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewingSubmission(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white font-mono">
                      Form Submission Record
                    </h3>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {viewingSubmission.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Submitted on {new Date(viewingSubmission.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] font-mono">
              {/* Contact Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">
                    Contact Name
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {viewingSubmission.name || "N/A (Subscriber)"}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">
                    Email Address
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${viewingSubmission.email}`}
                      className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{viewingSubmission.email}</span>
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(viewingSubmission.email);
                        addToast("success", "Copied", "Email copied to clipboard.");
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                      title="Copy Email"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">
                    Form Category / Topic
                  </span>
                  <div className="text-xs text-slate-800 dark:text-slate-200 font-bold">
                    {viewingSubmission.category || "General Inquiry"}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold block mb-1">
                    Status
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                      viewingSubmission.status === "read"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                        : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                    }`}
                  >
                    {viewingSubmission.status}
                  </span>
                </div>
              </div>

              {/* Full Message Section */}
              <div className="space-y-2">
                <span className="text-xs uppercase text-slate-600 dark:text-slate-400 font-bold block">
                  Full Message Content:
                </span>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {viewingSubmission.message || "No detailed message text attached."}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 flex items-center justify-between gap-4 font-mono">
              <button
                onClick={() => handleDeleteRow(viewingSubmission.id)}
                className="px-3.5 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${viewingSubmission.email}?subject=RE: ${viewingSubmission.category || "Inquiry"}`}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </a>

                <button
                  onClick={() => setViewingSubmission(null)}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
