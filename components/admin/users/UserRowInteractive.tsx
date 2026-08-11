"use client";

import { useState } from "react";
import { UserRoleSelector } from "./UserRoleSelector";
import { UserDetailsModal } from "./UserDetailsModal";
import { Mail, Calendar, Eye } from "lucide-react";

interface UserRowInteractiveProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: string;
    emailVerified: string | null;
  };
  isSelf: boolean;
  roleBadgeStyle: string;
}

export function UserRowInteractive({ user, isSelf, roleBadgeStyle }: UserRowInteractiveProps) {
  const [showModal, setShowModal] = useState(false);

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0].toUpperCase() || "U";

  return (
    <>
      <tr
        onClick={() => setShowModal(true)}
        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
      >
        <td className="p-4 pl-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 font-bold text-xs text-amber-400 flex items-center justify-center shrink-0 group-hover:border-sky-500/50 transition-colors">
              {initials}
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2 group-hover:text-sky-400 transition-colors">
                <span>{user.name || "Unnamed User"}</span>
                {isSelf && (
                  <span className="bg-sky-500/20 text-sky-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-sky-500/30">
                    YOU
                  </span>
                )}
              </div>
              <span className="font-mono text-[10px] text-slate-500 uppercase">{user.id}</span>
            </div>
          </div>
        </td>

        <td className="p-4 font-mono text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>{user.email}</span>
          </div>
        </td>

        <td className="p-4">
          <span className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border ${roleBadgeStyle}`}>
            {user.role}
          </span>
        </td>

        <td className="p-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </td>

        <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-sky-500/40 hover:bg-sky-500/10 text-slate-400 hover:text-sky-400 transition-colors"
              title="View full user details & history"
            >
              <Eye className="w-4 h-4" />
            </button>
            <UserRoleSelector userId={user.id} currentRole={user.role} isSelf={isSelf} />
          </div>
        </td>
      </tr>

      {/* User Details Modal */}
      <UserDetailsModal
        userId={user.id}
        userEmail={user.email}
        userName={user.name}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isSelf={isSelf}
      />
    </>
  );
}
