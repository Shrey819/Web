"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getUserDetailsAction } from "@/app/admin/(dashboard)/users/actions";
import { UserRoleSelector } from "./UserRoleSelector";
import { X, Mail, MapPin, ShoppingCart, Shield, Calendar, Loader2, DollarSign, Building2, CheckCircle2, AlertCircle, Phone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface UserDetailsModalProps {
  userId: string;
  userEmail: string | null;
  userName: string | null;
  isOpen: boolean;
  onClose: () => void;
  isSelf: boolean;
}

export function UserDetailsModal({ userId, userEmail, userName, isOpen, onClose, isSelf }: UserDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      getUserDetailsAction(userId, userEmail).then((res) => {
        setLoading(false);
        if (res.success) {
          setData(res);
        }
      });
    }
  }, [isOpen, userId, userEmail]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border-l sm:border border-slate-200 dark:border-slate-800 w-full max-w-2xl h-full sm:h-[92vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 relative text-slate-900 dark:text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3.5">
            {data?.user?.image || data?.user?.avatar ? (
              <img
                src={data.user.image || data.user.avatar}
                alt={userName || "User Avatar"}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 font-extrabold text-blue-600 dark:text-blue-400 text-lg flex items-center justify-center font-mono shrink-0">
                {(userName || userEmail || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{userName || "Unnamed Account"}</h2>
                {isSelf && (
                  <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/30">
                    YOU
                  </span>
                )}
              </div>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{userEmail || "No Email Provided"}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="text-xs font-mono">Loading User Profile & Activity Data...</span>
            </div>
          ) : !data || !data.user ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Could not load user details.
            </div>
          ) : (
            <>
              {/* Account Quick Stats Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Account Role</span>
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">{data.user.role}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Spend</span>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">{formatCurrency(data.totalSpend)}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Orders</span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">{data.orders.length} Placed</div>
                </div>
              </div>

              {/* Login & Verification Status */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Identity & Google Profile Telemetry
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">User Account ID:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 select-all">{data.user.id}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Auth Provider:</span>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {data.user.google_sub ? (
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
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
                          Google OAuth 2.0
                        </span>
                      ) : null}
                      {data.user.hasPassword ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-mono px-2 py-0.5 rounded-full">
                          Password Auth
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {data.user.given_name && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">First Name (Given):</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{data.user.given_name}</span>
                    </div>
                  )}

                  {data.user.family_name && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Last Name (Family):</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{data.user.family_name}</span>
                    </div>
                  )}

                  {data.user.google_sub && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 dark:text-slate-400 block">Google Subject ID (sub):</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px] select-all bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 inline-block mt-0.5">
                        {data.user.google_sub}
                      </span>
                    </div>
                  )}

                  {data.user.locale && (
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Locale:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 uppercase">{data.user.locale}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Email Verification:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {data.user.emailVerified ? `Verified on ${new Date(data.user.emailVerified).toLocaleDateString()}` : "Verified Account"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Registered Date:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {data.user.createdAt ? new Date(data.user.createdAt).toLocaleString("en-IN") : "N/A"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Last Updated:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {data.user.updatedAt ? new Date(data.user.updatedAt).toLocaleString("en-IN") : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact & Shipping Addresses */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Shipping & Corporate Address
                </h4>

                {data.addresses.length === 0 && data.orders.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 italic">
                    No saved addresses or shipping locations recorded for this user.
                  </div>
                ) : data.addresses.length > 0 ? (
                  <div className="space-y-2">
                    {data.addresses.map((a: any) => (
                      <div key={a.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                          <span>{a.fullName} {a.companyName && `(${a.companyName})`}</span>
                          {a.isDefault && (
                            <span className="text-[9px] font-mono text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/30 uppercase">
                              Default Address
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">{a.street}, {a.city}, {a.state} {a.zip}, {a.country}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Fallback to address from most recent order */
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                      <span>{data.orders[0].shippingFullName} {data.orders[0].shippingCompany && `(${data.orders[0].shippingCompany})`}</span>
                      <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30 uppercase">
                        Order Shipping Address
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      {data.orders[0].shippingStreet}, {data.orders[0].shippingCity}, {data.orders[0].shippingState} {data.orders[0].shippingZip}, {data.orders[0].shippingCountry}
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1.5 pt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Direct Mobile: <a href={`tel:${data.orders[0].shippingPhone || '+91 9876543210'}`} className="font-bold hover:underline">{data.orders[0].shippingPhone || "+91 9876543210"}</a></span>
                    </p>
                  </div>
                )}
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" /> B2B Order History ({data.orders.length})
                  </h4>
                </div>

                {data.orders.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 italic">
                    This user has not placed any orders yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.orders.map((o: any) => (
                      <div key={o.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs hover:border-blue-300 dark:hover:border-blue-500/40 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{o.id}</span>
                            <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                              o.status === "DELIVERED"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                                : "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                            }`}>
                              {o.status}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>

                        <div className="text-right space-y-1">
                          <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(o.total)}</div>
                          <Link
                            href={`/admin/orders`}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold block"
                          >
                            View Order →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {data?.user && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-bold uppercase">Change Role:</span>
              <UserRoleSelector userId={data.user.id} currentRole={data.user.role} isSelf={isSelf} />
            </div>

            <a
              href={`mailto:${data.user.email}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors border border-slate-300 dark:border-slate-700 shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Email User</span>
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
