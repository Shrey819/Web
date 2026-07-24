import React from "react";
import { SpecificationGroup } from "@/types";

interface SpecsTableProps {
  specifications: SpecificationGroup[];
}

export function SpecsTable({ specifications }: SpecsTableProps) {
  return (
    <div className="space-y-6">
      {specifications.map((group, groupIdx) => (
        <div key={groupIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-slate-100/80 px-4 py-3 border-b border-slate-200">
            <h3 className="font-bold font-mono text-sm text-slate-800">{group.groupName}</h3>
          </div>
          <table className="w-full text-xs text-left border-collapse">
            <tbody>
              {group.attributes.map((attr, idx) => (
                <tr
                  key={attr.label}
                  className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                >
                  <td className="p-3.5 font-mono font-bold text-slate-700 w-1/3 border-r border-slate-200/80">
                    {attr.label}
                  </td>
                  <td className="p-3.5 font-mono text-slate-900 font-medium">
                    {attr.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
