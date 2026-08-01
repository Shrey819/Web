"use client";

import React, { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { BulkUploadModal } from "./BulkUploadModal";
import { useRouter } from "next/navigation";

export function BulkUploadButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
      >
        <FileSpreadsheet className="w-4 h-4 text-purple-400" />
        Bulk Upload Excel
      </button>

      <BulkUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
