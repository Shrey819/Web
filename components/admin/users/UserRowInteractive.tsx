"use client";

import { useState } from "react";
import { UserRoleSelector } from "./UserRoleSelector";
import { UserDetailsModal } from "./UserDetailsModal";
import { Mail, Calendar, Eye, Key } from "lucide-react";

interface UserRowInteractiveProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    image: string | null;
    avatar: string | null;
    google_sub: string | null;
    given_name?: string | null;
    family_name?: string | null;
    locale?: string | null;
    hasPassword: boolean;
    createdAt: string;
    emailVerified: string | null;
  };
  isSelf: boolean;
  roleBadgeStyle: string;
}

export function UserRowInteractive({ user, isSelf, roleBadgeStyle }: UserRowInteractiveProps) {
  const [showModal, setShowModal] = useState(false);

  const displayName = user.name || [user.given_name, user.family_name].filter(Boolean).join(" ") || "Unnamed User";
  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0].toUpperCase() || "U";
  const userAvatar = user.image || user.avatar;

  return (
    <>
      <tr
        onClick={() => setShowModal(true)}
        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
      >
        {/* User / Account column with Google / Custom Profile Image */}
        <td className="p-4 pl-6">
          <div className="flex items-center gap-3">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-2xl object-cover border border-slate-700 group-hover:border-sky-500/50 transition-colors shrink-0 shadow"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 font-bold text-xs text-amber-400 flex items-center justify-center shrink-0 group-hover:border-sky-500/50 transition-colors">
                {initials}
              </div>
            )}
            <div>
              <div className="font-bold text-white flex items-center gap-2 group-hover:text-sky-400 transition-colors">
                <span>{displayName}</span>
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

        {/* Email */}
        <td className="p-4 font-mono text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>{user.email}</span>
          </div>
        </td>

        {/* Auth Method Indicator */}
        <td className="p-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {user.google_sub ? (
              <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shadow-sm">
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </span>
            ) : null}

            {user.hasPassword ? (
              <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono px-2 py-0.5 rounded-full">
                <Key className="w-2.5 h-2.5" />
                <span>Password</span>
              </span>
            ) : null}

            {!user.google_sub && !user.hasPassword && (
              <span className="text-[10px] font-mono text-slate-500">Unset</span>
            )}
          </div>
        </td>

        {/* Role Badge */}
        <td className="p-4">
          <span className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border ${roleBadgeStyle}`}>
            {user.role}
          </span>
        </td>

        {/* Registered Date */}
        <td className="p-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </td>

        {/* Access Control */}
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
        userName={displayName}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isSelf={isSelf}
      />
    </>
  );
}
