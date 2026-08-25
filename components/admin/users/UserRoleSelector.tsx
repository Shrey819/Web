"use client";

import { useState } from "react";
import { updateUserRoleAction, deleteUserAction } from "@/app/admin/(dashboard)/users/actions";
import { useToastStore } from "@/store/useToastStore";
import { Trash2, Shield, Loader2 } from "lucide-react";

interface UserRoleSelectorProps {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}

export function UserRoleSelector({ userId, currentRole, isSelf }: UserRoleSelectorProps) {
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToastStore();

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setLoading(true);
    const res = await updateUserRoleAction(userId, newRole);
    setLoading(false);

    if (res.success) {
      setRole(newRole);
      addToast("success", "Role Updated", `User role changed to ${newRole}`);
    } else {
      addToast("error", "Role Update Failed", res.error || "Could not update role");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this user account?")) return;
    setDeleting(true);
    const res = await deleteUserAction(userId);
    setDeleting(false);

    if (res.success) {
      addToast("success", "User Deleted", "User account removed from database.");
    } else {
      addToast("error", "Delete Failed", res.error || "Could not delete user");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={role}
          onChange={handleRoleChange}
          disabled={loading || isSelf}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 disabled:opacity-50 cursor-pointer"
        >
          <option value="SUPER_ADMIN">SUPER ADMIN</option>
          <option value="ADMIN">ADMIN</option>
          <option value="CATALOG_MANAGER">CATALOG MANAGER</option>
          <option value="CUSTOMER">CUSTOMER</option>
        </select>
        {loading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-lg flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
        )}
      </div>

      {!isSelf && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-50 cursor-pointer"
          title="Delete user account"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}
