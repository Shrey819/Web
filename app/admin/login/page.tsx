"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl relative z-10 overflow-hidden"
      >
        <div className="p-8 sm:p-10 border-b border-slate-100 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-center mx-auto mb-6 shadow-2xs">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="type-section-title text-slate-900 mb-2">Admin Portal</h1>
          <p className="type-body-small text-slate-500">Secure access restricted to authorized personnel.</p>
        </div>
        
        <div className="p-8 sm:p-10 bg-white">
          <form action={dispatch} className="space-y-6">
            <div className="space-y-2">
              <label className="type-label text-slate-700 ml-1">Corporate Email</label>
              <input 
                type="email" 
                name="email"
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                placeholder="admin@omautomation.com"
              />
            </div>
            
            <div className="space-y-2">
              <label className="type-label text-slate-700 ml-1">Master Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  name="password"
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  placeholder="Enter password"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 type-body-small text-center"
              >
                {errorMessage}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 type-button flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {isPending ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
