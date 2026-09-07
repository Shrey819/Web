import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function calculateDiscount(price: number, originalPrice: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function formatDisplayPhone(raw?: string | null): string {
  if (!raw) return "";
  let cleaned = raw.trim();

  // Strip repeated +91 / country code e.g. "+91 +91 8530478239" or "+91+91"
  while (/^\+?91[\s-]*\+?91/i.test(cleaned)) {
    cleaned = cleaned.replace(/^\+?91[\s-]*\+?91[\s-]*/i, "+91 ");
  }

  // If it already starts with +, clean internal extra spacing
  if (cleaned.startsWith("+")) {
    const parts = cleaned.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts.slice(1).join(" ")}`;
    }
    if (cleaned.startsWith("+91") && cleaned.length === 13) {
      return `+91 ${cleaned.slice(3)}`;
    }
    return cleaned;
  }

  // If 10 digits without + prefix, format as +91 XXXXXXXXXX
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2)}`;
  }

  return cleaned ? `+91 ${cleaned}` : "";
}
