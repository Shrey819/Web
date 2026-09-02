"use client";

import { useState, useMemo } from "react";
import {
  COUNTRIES,
  INDIA_STATES_DATA,
  getIndiaStates,
  getCitiesForState,
  getSuggestedStateForPincode,
  validatePincodeWithState,
} from "@/lib/indiaLocations";
import { AlertCircle, AlertTriangle, Check, ChevronDown, Globe, MapPin, Sparkles } from "lucide-react";

interface AddressLocationSelectorProps {
  country: string;
  state: string;
  city: string;
  zip: string;
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  onZipChange: (zip: string) => void;
  isFieldMissing?: (val: string) => boolean;
  disabled?: boolean;
}

export function AddressLocationSelector({
  country,
  state,
  city,
  zip,
  onCountryChange,
  onStateChange,
  onCityChange,
  onZipChange,
  isFieldMissing,
  disabled = false,
}: AddressLocationSelectorProps) {
  const isIndia = !country || country.trim().toLowerCase() === "india";

  const allIndiaStates = useMemo(() => getIndiaStates(), []);
  const availableCities = useMemo(() => (isIndia ? getCitiesForState(state) : []), [isIndia, state]);

  // Real-time mismatch validation for India
  const pinValidation = useMemo(() => {
    if (!isIndia || !zip || zip.trim().length < 6) return null;
    return validatePincodeWithState(zip, state);
  }, [isIndia, zip, state]);

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isIndia) {
      const clean = e.target.value.replace(/[^\d]/g, "").slice(0, 6);
      onZipChange(clean);

      // Auto-suggest state if state is currently blank and 6 digits are typed
      if (clean.length === 6 && !state) {
        const suggested = getSuggestedStateForPincode(clean);
        if (suggested) {
          onStateChange(suggested);
        }
      }
    } else {
      onZipChange(e.target.value);
    }
  };

  const handleFixState = (expectedState: string) => {
    onStateChange(expectedState);
    // Reset city if not matching new state
    const newCities = getCitiesForState(expectedState);
    if (!newCities.includes(city)) {
      onCityChange("");
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Country Selection */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-600" />
          <span>Country / Region</span> <span className="text-rose-500 font-bold">*</span>
        </label>
        <div className="relative">
          <select
            value={country || "India"}
            onChange={(e) => {
              const newCountry = e.target.value;
              onCountryChange(newCountry);
              if (newCountry !== "India") {
                // Keep values but allow manual entry
              } else if (!state) {
                onStateChange("Gujarat");
              }
            }}
            disabled={disabled}
            className={`w-full p-3 rounded-2xl border bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none transition-all appearance-none cursor-pointer pr-10 ${
              isFieldMissing && isFieldMissing(country)
                ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                : "border-slate-200 dark:border-slate-700 focus:border-sky-500"
            }`}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c === "India" ? "🇮🇳 India (Standard Dispatch)" : c}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 2. State, City & PIN Code */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {/* State / Union Territory */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <span>{isIndia ? "State / UT" : "State / Province"}</span> <span className="text-rose-500 font-bold">*</span>
            </label>
            {isIndia && (
              <span className="text-[10px] text-slate-400 font-mono">
                36 States & UTs
              </span>
            )}
          </div>

          {isIndia ? (
            <div className="relative">
              <input
                type="text"
                list="india-states-list"
                value={state}
                onChange={(e) => {
                  const newState = e.target.value;
                  onStateChange(newState);
                }}
                placeholder="Select or type State / UT"
                disabled={disabled}
                className={`w-full p-3 rounded-2xl border bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none transition-all ${
                  isFieldMissing && isFieldMissing(state)
                    ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700 focus:border-sky-500"
                }`}
                required
              />
              <datalist id="india-states-list">
                {allIndiaStates.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          ) : (
            <input
              type="text"
              value={state}
              onChange={(e) => onStateChange(e.target.value)}
              placeholder="e.g. California, Bavaria"
              disabled={disabled}
              className={`w-full p-3 rounded-2xl border bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none transition-all ${
                isFieldMissing && isFieldMissing(state)
                  ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-700 focus:border-sky-500"
              }`}
              required
            />
          )}

          {isFieldMissing && isFieldMissing(state) && (
            <span className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> State is required
            </span>
          )}
        </div>

        {/* City / District */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <span>City / District</span> <span className="text-rose-500 font-bold">*</span>
            </label>
            {isIndia && availableCities.length > 0 && (
              <span className="text-[10px] text-slate-400 font-mono">
                {availableCities.length} cities
              </span>
            )}
          </div>

          {isIndia ? (
            <div className="relative">
              <input
                type="text"
                list="india-cities-list"
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                placeholder={state ? `Select or type city in ${state}` : "Select state first"}
                disabled={disabled}
                className={`w-full p-3 rounded-2xl border bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none transition-all ${
                  isFieldMissing && isFieldMissing(city)
                    ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700 focus:border-sky-500"
                }`}
                required
              />
              <datalist id="india-cities-list">
                {availableCities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          ) : (
            <input
              type="text"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="e.g. San Francisco, Munich"
              disabled={disabled}
              className={`w-full p-3 rounded-2xl border bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none transition-all ${
                isFieldMissing && isFieldMissing(city)
                  ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                  : "border-slate-200 dark:border-slate-700 focus:border-sky-500"
              }`}
              required
            />
          )}

          {isFieldMissing && isFieldMissing(city) && (
            <span className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> City is required
            </span>
          )}
        </div>

        {/* PIN / ZIP Code */}
        <div>
          <label className="font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
            <span>{isIndia ? "PIN Code (6 Digits)" : "Postal / ZIP Code"}</span> <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={zip}
            onChange={handlePincodeChange}
            placeholder={isIndia ? "e.g. 382028, 700144" : "e.g. 94103, 80331"}
            maxLength={isIndia ? 6 : 12}
            disabled={disabled}
            className={`w-full p-3 rounded-2xl border bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none transition-all font-mono tracking-wider ${
              (isFieldMissing && isFieldMissing(zip)) || (pinValidation && !pinValidation.isValid)
                ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                : "border-slate-200 dark:border-slate-700 focus:border-sky-500"
            }`}
            required
          />

          {isFieldMissing && isFieldMissing(zip) && (
            <span className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> PIN Code is required
            </span>
          )}
        </div>
      </div>

      {/* Real-Time PIN & State Mismatch Inline Error Alert */}
      {isIndia && pinValidation && !pinValidation.isValid && pinValidation.expectedState && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">PIN Code Region Mismatch</span>
              <span className="text-[11px] opacity-90">{pinValidation.message}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleFixState(pinValidation.expectedState!)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-[11px] shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Switch State to {pinValidation.expectedState}</span>
          </button>
        </div>
      )}
    </div>
  );
}
