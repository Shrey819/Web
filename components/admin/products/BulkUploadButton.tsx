"use client";

import React, { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { BulkUploadModal } from "./BulkUploadModal";
import { useRouter } from "next/navigation";
import { useAdminThemeStore } from "@/store/useAdminThemeStore";

export function BulkUploadButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme } = useAdminThemeStore();
  const isLight = theme === "light";
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`px-4 py-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
          isLight
            ? "bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm"
            : "bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border-purple-500/30"
        }`}
      >
        <FileSpreadsheet className={`w-4 h-4 ${isLight ? "text-purple-600" : "text-purple-400"}`} />
        <span>Bulk Upload Excel</span>
      </button>

      <BulkUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
