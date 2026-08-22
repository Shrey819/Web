"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="p-8 sm:p-10 border-b border-slate-800/50 text-center">
          <div className="w-16 h-16 bg-slate-800/50 rounded-2xl border border-slate-700/50 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-sky-400" />
          </div>
          <h1 className="type-section-title text-white mb-2">Admin Portal</h1>
          <p className="type-body-small text-slate-400">Secure access restricted to authorized personnel.</p>
        </div>
        
        <div className="p-8 sm:p-10 bg-slate-900/50">
          <form action={dispatch} className="space-y-6">
            <div className="space-y-2">
              <label className="type-label text-slate-300 ml-1">Corporate Email</label>
              <input 
                type="email" 
                name="email"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="admin@propelauto.com"
              />
            </div>
            
            <div className="space-y-2">
              <label className="type-label text-slate-300 ml-1">Master Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  name="password"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="Enter password"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
            </div>

            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 type-body-small text-center"
              >
                {errorMessage}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={isPending}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white rounded-xl py-3.5 type-button flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-sky-600/20"
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
