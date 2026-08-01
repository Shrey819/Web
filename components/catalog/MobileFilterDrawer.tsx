"use client";

import { FilterSidebar, FilterState, CategoryFilterItem } from "./FilterSidebar";
import { X, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onReset: () => void;
  totalResults: number;
  categories?: CategoryFilterItem[];
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onReset,
  totalResults,
  categories = [],
}: MobileFilterDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-xs bg-white z-50 lg:hidden flex flex-col justify-between overflow-y-auto"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                <span>Filter Hardware ({totalResults})</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1">
              <FilterSidebar
                filters={filters}
                onFilterChange={onFilterChange}
                onReset={onReset}
                totalResults={totalResults}
                categories={categories}
              />
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full bg-slate-900 text-white type-button"
              >
                Apply Filters ({totalResults} Results)
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
