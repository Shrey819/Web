import React from "react";

interface BrandLogoProps {
  slug?: string;
  name?: string;
  logoUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "full";
}

export function BrandLogo({
  slug = "",
  name = "",
  logoUrl,
  className = "w-full h-full object-contain",
  size = "lg",
}: BrandLogoProps) {
  // If a custom logo was uploaded to database, prioritize it and make it full size
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name || "Brand logo"}
        className={`object-contain transition-transform duration-300 group-hover:scale-105 ${className}`}
        loading="lazy"
      />
    );
  }

  const cleanSlug = (slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

  // HIWIN
  if (cleanSlug.includes("hiwin")) {
    if (size === "sm") {
      return (
        <span className="text-xs font-black italic tracking-tighter text-[#00a651]">
          HIWIN
        </span>
      );
    }
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-3xl sm:text-5xl font-black italic tracking-tighter text-[#00a651] font-sans select-none flex items-center">
          HIWIN<sup className="text-xs sm:text-sm font-bold ml-1 not-italic">®</sup>
        </span>
      </div>
    );
  }

  // Miki Pulley
  if (cleanSlug.includes("miki")) {
    if (size === "sm") {
      return (
        <span className="text-[10px] font-black text-slate-900 tracking-tight">
          MIKI
        </span>
      );
    }
    return (
      <div className={`flex items-center justify-center gap-2.5 sm:gap-3.5 ${className}`}>
        <div className="flex items-center gap-1 select-none">
          <span className="w-2 sm:w-2.5 h-8 sm:h-10 bg-[#0284c7] transform -skew-x-12 rounded-xs" />
          <span className="w-2 sm:w-2.5 h-8 sm:h-10 bg-[#ea580c] transform -skew-x-12 rounded-xs" />
          <span className="w-2 sm:w-2.5 h-8 sm:h-10 bg-[#0284c7] transform -skew-x-12 rounded-xs" />
        </div>
        <span className="text-xl sm:text-3xl font-black tracking-wider text-slate-900 font-sans uppercase select-none">
          MIKI PULLEY
        </span>
      </div>
    );
  }

  // Liming
  if (cleanSlug.includes("liming")) {
    if (size === "sm") {
      return (
        <span className="text-[10px] font-black text-[#dc2626]">
          LIMING
        </span>
      );
    }
    return (
      <div className={`flex flex-col items-center justify-center ${className} select-none`}>
        <div className="flex items-center justify-center mb-1.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 sm:border-3 border-[#dc2626] flex items-center justify-center text-[#dc2626] font-black text-xl sm:text-2xl shadow-2xs">
            ⚙
          </div>
        </div>
        <span className="text-2xl sm:text-4xl font-black tracking-widest text-[#dc2626] font-sans uppercase">
          LIMING
        </span>
      </div>
    );
  }

  // K.H Kai He
  if (cleanSlug.includes("kh") || cleanSlug.includes("kai-he")) {
    if (size === "sm") {
      return (
        <span className="px-1.5 py-0.5 rounded bg-[#b91c1c] text-white text-[9px] font-black">
          K.H
        </span>
      );
    }
    return (
      <div className={`flex flex-col items-center justify-center ${className} select-none`}>
        <div className="px-5 sm:px-6 py-1.5 rounded-full bg-[#b91c1c] text-white font-black text-sm sm:text-base tracking-wider mb-2 shadow-xs">
          K.H
        </div>
        <span className="text-xs sm:text-sm font-black tracking-widest text-slate-800 uppercase font-sans">
          KAI HE MACHINERY
        </span>
      </div>
    );
  }

  // STÖBER / STOBER
  if (cleanSlug.includes("stober") || cleanSlug.includes("stoeber")) {
    if (size === "sm") {
      return (
        <span className="text-[10px] font-black text-[#0284c7]">
          STÖBER
        </span>
      );
    }
    return (
      <div className={`flex flex-col items-center justify-center ${className} select-none`}>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2.5 border-[#0284c7] flex items-center justify-center text-[#0284c7] font-bold text-xs mb-1.5">
          STOBER
        </div>
        <span className="text-2xl sm:text-4xl font-black tracking-wider text-[#0284c7] font-sans uppercase">
          STÖBER
        </span>
      </div>
    );
  }

  // Atlanta
  if (cleanSlug.includes("atlanta")) {
    if (size === "sm") {
      return (
        <span className="text-[10px] font-black italic text-slate-900">
          ATLANTA
        </span>
      );
    }
    return (
      <div className={`flex items-center justify-center ${className} select-none`}>
        <span className="text-3xl sm:text-5xl font-black italic tracking-widest text-slate-900 uppercase font-mono border-b-3 sm:border-b-4 border-slate-900 pb-1">
          ATLANTA
        </span>
      </div>
    );
  }

  // Elesa+Ganter
  if (cleanSlug.includes("elesa") || cleanSlug.includes("ganter") || cleanSlug.includes("e-g")) {
    if (size === "sm") {
      return (
        <span className="text-[10px] font-black text-[#dc2626]">
          E+G
        </span>
      );
    }
    return (
      <div className={`flex items-center justify-center gap-2 ${className} select-none`}>
        <span className="text-2xl sm:text-4xl font-black text-[#dc2626] font-serif tracking-tight">
          elesa+Ganter
        </span>
        <span className="px-2 py-1 bg-[#dc2626] text-white font-black text-xs sm:text-sm rounded-xs">
          EG
        </span>
      </div>
    );
  }

  // Aadarsh / ADDPower
  if (cleanSlug.includes("aadarsh") || cleanSlug.includes("addpower")) {
    if (size === "sm") {
      return (
        <span className="text-[10px] font-bold text-[#ea580c]">
          Aadarsh
        </span>
      );
    }
    return (
      <div className={`flex flex-col items-center justify-center ${className} select-none`}>
        <div className="px-5 py-2 rounded-xl border-2 border-amber-400 bg-amber-50/70 flex items-center gap-1.5 mb-1 shadow-2xs">
          <span className="text-2xl sm:text-3xl font-black text-[#ea580c] tracking-tight font-sans">
            ADDPower
          </span>
          <span className="text-amber-500 text-sm">🌻</span>
        </div>
        <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
          Aadarsh
        </span>
      </div>
    );
  }

  // THK
  if (cleanSlug.includes("thk")) {
    if (size === "sm") {
      return (
        <span className="text-xs font-black text-[#dc2626]">
          THK
        </span>
      );
    }
    return (
      <div className={`flex items-center justify-center ${className} select-none`}>
        <span className="text-4xl sm:text-6xl font-black tracking-tight text-[#dc2626] font-sans">
          THK
        </span>
      </div>
    );
  }

  // Rexroth
  if (cleanSlug.includes("rexroth")) {
    if (size === "sm") {
      return (
        <span className="text-[10px] font-black text-[#0284c7]">
          rexroth
        </span>
      );
    }
    return (
      <div className={`flex flex-col items-center justify-center ${className} select-none`}>
        <span className="text-xs sm:text-sm font-bold tracking-widest text-slate-500 uppercase mb-0.5">
          A Bosch Company
        </span>
        <span className="text-3xl sm:text-5xl font-black tracking-tight text-[#0284c7] font-sans lowercase">
          rexroth
        </span>
      </div>
    );
  }

  // Siemens
  if (cleanSlug.includes("siemens")) {
    if (size === "sm") {
      return (
        <span className="text-[10px] font-black text-[#00646e]">
          SIEMENS
        </span>
      );
    }
    return (
      <div className={`flex items-center justify-center ${className} select-none`}>
        <span className="text-3xl sm:text-5xl font-black tracking-widest text-[#00646e] font-sans uppercase">
          SIEMENS
        </span>
      </div>
    );
  }

  // Schneider Electric
  if (cleanSlug.includes("schneider")) {
    if (size === "sm") {
      return (
        <span className="text-[9px] font-bold text-slate-900">
          Schneider
        </span>
      );
    }
    return (
      <div className={`flex items-center justify-center gap-2.5 ${className} select-none`}>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xs bg-[#3dcd58] flex items-center justify-center text-white text-xs sm:text-sm font-bold">
          ⚡
        </div>
        <span className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 font-sans">
          Schneider <span className="font-light text-slate-600">Electric</span>
        </span>
      </div>
    );
  }

  // Delta
  if (cleanSlug.includes("delta")) {
    if (size === "sm") {
      return (
        <span className="text-[10px] font-black text-[#0284c7]">
          DELTA
        </span>
      );
    }
    return (
      <div className={`flex items-center justify-center gap-2 ${className} select-none`}>
        <span className="text-2xl sm:text-3xl font-black text-[#0284c7]">▲</span>
        <span className="text-3xl sm:text-5xl font-black tracking-wider text-[#0284c7] font-sans uppercase">
          DELTA
        </span>
      </div>
    );
  }

  // Omron
  if (cleanSlug.includes("omron")) {
    if (size === "sm") {
      return (
        <span className="text-xs font-black text-[#1d4ed8]">
          OMRON
        </span>
      );
    }
    return (
      <div className={`flex items-center justify-center ${className} select-none`}>
        <span className="text-3xl sm:text-5xl font-black tracking-widest text-[#1d4ed8] font-sans uppercase">
          OMRON
        </span>
      </div>
    );
  }

  // ABB
  if (cleanSlug.includes("abb")) {
    if (size === "sm") {
      return (
        <span className="text-xs font-black text-[#e11d48]">
          ABB
        </span>
      );
    }
    return (
      <div className={`flex items-center justify-center ${className} select-none`}>
        <span className="text-4xl sm:text-6xl font-black tracking-tight text-[#e11d48] font-sans uppercase">
          ABB
        </span>
      </div>
    );
  }

  // NSK
  if (cleanSlug.includes("nsk")) {
    if (size === "sm") {
      return (
        <span className="text-xs font-black text-[#dc2626]">
          NSK
        </span>
      );
    }
    return (
      <div className={`flex items-center justify-center ${className} select-none`}>
        <span className="text-4xl sm:text-6xl font-black tracking-tight text-[#dc2626] font-sans uppercase">
          NSK
        </span>
      </div>
    );
  }

  // Generic fallback with initials avatar (for Default Brand, Demo B2, Demo Brand, etc.)
  const initials = (name || slug)
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase() || "OEM";

  if (size === "sm") {
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black flex items-center justify-center text-xs">
        {initials}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 sm:gap-3.5 ${className} select-none`}>
      <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-slate-900 text-white font-black flex items-center justify-center text-xl sm:text-2xl shadow-md border border-slate-800">
        {initials}
      </div>
      <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight text-center max-w-[220px] truncate">
        {name || slug}
      </span>
    </div>
  );
}
