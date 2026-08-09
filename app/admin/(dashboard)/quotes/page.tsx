"use server";

import { getAllQuotesAdminAction } from "@/app/actions/quote";
import { AdminQuotesClient } from "./AdminQuotesClient";

export default async function AdminQuotesPage() {
  const { quotes } = await getAllQuotesAdminAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-mono font-extrabold text-white">Bulk Quote Requests (RFQs)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review corporate B2B quotation requests, inspect BOM lines, and record quote responses.
        </p>
      </div>

      <AdminQuotesClient initialQuotes={quotes} />
    </div>
  );
}
