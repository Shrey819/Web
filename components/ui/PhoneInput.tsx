"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Check, AlertCircle, CheckCircle2 } from "lucide-react";

export interface CountryCode {
  name: string;
  code: string;
  prefix: string;
  flag: string;
  placeholder: string;
  minDigits: number;
  maxDigits: number;
}

export const COUNTRIES: CountryCode[] = [
  { name: "India", code: "IN", prefix: "+91", flag: "🇮🇳", placeholder: "98765 43210", minDigits: 10, maxDigits: 10 },
  { name: "United States", code: "US", prefix: "+1", flag: "🇺🇸", placeholder: "555 000 0000", minDigits: 10, maxDigits: 10 },
  { name: "United Kingdom", code: "GB", prefix: "+44", flag: "🇬🇧", placeholder: "7911 123456", minDigits: 10, maxDigits: 10 },
  { name: "United Arab Emirates", code: "AE", prefix: "+971", flag: "🇦🇪", placeholder: "50 123 4567", minDigits: 9, maxDigits: 9 },
  { name: "Singapore", code: "SG", prefix: "+65", flag: "🇸🇬", placeholder: "8123 4567", minDigits: 8, maxDigits: 8 },
  { name: "Germany", code: "DE", prefix: "+49", flag: "🇩🇪", placeholder: "151 12345678", minDigits: 10, maxDigits: 11 },
  { name: "Japan", code: "JP", prefix: "+81", flag: "🇯🇵", placeholder: "90 1234 5678", minDigits: 10, maxDigits: 10 },
  { name: "Australia", code: "AU", prefix: "+61", flag: "🇦🇺", placeholder: "412 345 678", minDigits: 9, maxDigits: 9 },
  { name: "Canada", code: "CA", prefix: "+1", flag: "🇨🇦", placeholder: "555 000 0000", minDigits: 10, maxDigits: 10 },
  { name: "Saudi Arabia", code: "SA", prefix: "+966", flag: "🇸🇦", placeholder: "50 123 4567", minDigits: 9, maxDigits: 9 },
  { name: "Malaysia", code: "MY", prefix: "+60", flag: "🇲🇾", placeholder: "12 345 6789", minDigits: 9, maxDigits: 10 },
  { name: "Netherlands", code: "NL", prefix: "+31", flag: "🇳🇱", placeholder: "6 12345678", minDigits: 9, maxDigits: 9 },
  { name: "South Korea", code: "KR", prefix: "+82", flag: "🇰🇷", placeholder: "10 1234 5678", minDigits: 9, maxDigits: 10 },
  { name: "France", code: "FR", prefix: "+33", flag: "🇫🇷", placeholder: "6 12 34 56 78", minDigits: 9, maxDigits: 9 },
  { name: "Italy", code: "IT", prefix: "+39", flag: "🇮🇹", placeholder: "312 345 6789", minDigits: 9, maxDigits: 10 },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullPhone: string) => void;
  required?: boolean;
  className?: string;
}

export function PhoneInput({ value, onChange, required = true, className = "" }: PhoneInputProps) {
  const defaultCountry = COUNTRIES[0]; // India (+91)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(defaultCountry);
  const [nationalNumber, setNationalNumber] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal state when parent value changes or initializes
  useEffect(() => {
    if (value) {
      const matched = COUNTRIES.find((c) => value.startsWith(c.prefix));
      if (matched) {
        setSelectedCountry(matched);
        const digitsOnly = value.replace(matched.prefix, "").replace(/[^\d]/g, "").slice(0, matched.maxDigits);
        setNationalNumber(digitsOnly);
      } else {
        const digitsOnly = value.replace(/[^\d]/g, "").slice(0, defaultCountry.maxDigits);
        setNationalNumber(digitsOnly);
      }
    } else {
      setNationalNumber("");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch("");
    // Trim digits to new country's maxDigits
    const trimmed = nationalNumber.slice(0, country.maxDigits);
    setNationalNumber(trimmed);
    onChange(`${country.prefix} ${trimmed}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Strip non-digit characters and truncate to country maxDigits
    const digits = rawVal.replace(/[^\d]/g, "").slice(0, selectedCountry.maxDigits);
    setNationalNumber(digits);
    onChange(`${selectedCountry.prefix} ${digits}`);
  };

  // Validation Check
  const digitsCount = nationalNumber.length;
  let validationMessage: { type: "valid" | "invalid" | "incomplete"; text: string } | null = null;

  if (selectedCountry.code === "IN") {
    if (digitsCount === 0) {
      validationMessage = { type: "incomplete", text: "Enter 10-digit mobile number" };
    } else if (digitsCount < 10) {
      validationMessage = { type: "incomplete", text: `Enter ${10 - digitsCount} more digit${10 - digitsCount > 1 ? "s" : ""} (Exactly 10 digits required)` };
    } else if (!/^[6-9]\d{9}$/.test(nationalNumber)) {
      validationMessage = { type: "invalid", text: "Indian mobile numbers must start with 6, 7, 8, or 9" };
    } else {
      validationMessage = { type: "valid", text: "Valid 10-Digit Indian Mobile Number" };
    }
  } else {
    if (digitsCount < selectedCountry.minDigits) {
      validationMessage = { type: "incomplete", text: `Requires ${selectedCountry.minDigits} digits (${digitsCount}/${selectedCountry.minDigits})` };
    } else {
      validationMessage = { type: "valid", text: `Valid ${selectedCountry.name} Phone Number` };
    }
  }

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.prefix.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`space-y-1.5 ${className}`} ref={dropdownRef}>
      <div className={`flex items-center rounded-2xl border bg-white transition-all overflow-hidden shadow-sm ${
        validationMessage?.type === "invalid"
          ? "border-rose-500 ring-2 ring-rose-500/20"
          : validationMessage?.type === "valid"
          ? "border-emerald-500 ring-2 ring-emerald-500/20"
          : "border-slate-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20"
      }`}>
        {/* Country Flag & Prefix Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-3 bg-slate-50 border-r border-slate-200 hover:bg-slate-100 text-slate-800 font-mono text-xs font-bold shrink-0 transition-colors"
        >
          <span className="text-base">{selectedCountry.flag}</span>
          <span>{selectedCountry.prefix}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
        </button>

        {/* Local Number Input */}
        <div className="relative flex-1 flex items-center">
          <input
            type="tel"
            value={nationalNumber}
            onChange={handleNumberChange}
            placeholder={selectedCountry.placeholder}
            maxLength={selectedCountry.maxDigits}
            required={required}
            className="w-full pl-3 pr-9 py-3 text-xs font-mono text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none tracking-wider"
          />

          <div className="absolute right-3 flex items-center pointer-events-none">
            {validationMessage?.type === "valid" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            {validationMessage?.type === "invalid" && (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
          </div>
        </div>
      </div>

      {/* Helper Validation Text */}
      {validationMessage && (
        <div className={`text-[11px] font-mono flex items-center gap-1.5 px-1 ${
          validationMessage.type === "valid"
            ? "text-emerald-600 font-bold"
            : validationMessage.type === "invalid"
            ? "text-rose-600 font-bold"
            : "text-slate-500"
        }`}>
          {validationMessage.type === "valid" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
          {validationMessage.type === "invalid" && <AlertCircle className="w-3 h-3 text-rose-600" />}
          <span>{validationMessage.text}</span>
          <span className="ml-auto text-[10px] text-slate-400 font-bold">
            {digitsCount}/{selectedCountry.maxDigits}
          </span>
        </div>
      )}

      {/* Flag / Prefix Selection Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-sky-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {filteredCountries.map((country) => {
              const isSelected = country.code === selectedCountry.code;
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs text-left transition-colors ${
                    isSelected ? "bg-sky-50 text-sky-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{country.flag}</span>
                    <span className="truncate max-w-[130px]">{country.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                    <span>{country.prefix}</span>
                    <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                      {country.maxDigits}D
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
