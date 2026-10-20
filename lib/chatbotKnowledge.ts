export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  quickActions?: {
    label: string;
    href?: string;
    query?: string;
  }[];
  avatarMood?: "happy" | "thinking" | "listening" | "excited" | "celebrate" | "confused" | "proud";
}

export interface KnowledgeEntry {
  patterns: RegExp[];
  response: string;
  avatarMood: "happy" | "thinking" | "excited" | "celebrate" | "confused" | "proud";
  quickActions?: {
    label: string;
    href?: string;
    query?: string;
  }[];
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // 1. PLCs & Controllers
  {
    patterns: [/\bplc\b/i, /\bcontroller\b/i, /\bsiemens\b/i, /\bdelta\b/i, /\bmitsubishi\b/i, /\bs7-1200\b/i],
    response:
      "We stock 100% genuine industrial PLCs and CPU modules from top brands including Siemens (S7-1200, S7-1500), Delta (DVP, AS Series), and Mitsubishi. All units come with 1-year warranty and GST tax invoice.",
    avatarMood: "proud",
    quickActions: [
      { label: "Browse All PLCs", href: "/category/programmable-logic-controllers-plcs" },
      { label: "Request Bulk Quote", href: "/quote" },
    ],
  },

  // 2. VFDs / Inverters
  {
    patterns: [/\bvfd\b/i, /\bdrive\b/i, /\binverter\b/i, /\bmotor speed\b/i, /\bfrequency\b/i],
    response:
      "We provide Variable Frequency Drives (VFDs) from Delta, Schneider, ABB, and Fuji ranging from 0.4kW up to 315kW for heavy conveyor, pump, and spindle applications.",
    avatarMood: "excited",
    quickActions: [
      { label: "Search VFD Drives", href: "/products?search=vfd" },
      { label: "Compare Specs", href: "/compare" },
    ],
  },

  // 3. Sensors & Transducers
  {
    patterns: [/\bsensor\b/i, /\bproximity\b/i, /\bphotoelectric\b/i, /\bomron\b/i, /\bautonics\b/i, /\btransducer\b/i],
    response:
      "Looking for precision sensing? We supply Omron, Autonics, Sick, and Pepperl+Fuchs inductive proximity switches, laser displacement, fiber optic, and photoelectric sensors with IP67/IP69K protection.",
    avatarMood: "happy",
    quickActions: [
      { label: "Explore Sensors", href: "/category/sensors-transducers" },
      { label: "View Best Sellers", href: "/products" },
    ],
  },

  // 4. Bulk Quote / RFQ / Custom pricing
  {
    patterns: [/\bquote\b/i, /\brfq\b/i, /\bbulk\b/i, /\bdiscount\b/i, /\boem\b/i, /\bgst\b/i, /\btax invoice\b/i],
    response:
      "Need bulk OEM pricing or project billing? You can submit your Bill of Materials (BOM) through our official RFQ portal. Our technical sales engineers respond with a formal quotation within 2–4 business hours!",
    avatarMood: "celebrate",
    quickActions: [
      { label: "Submit Bulk RFQ", href: "/quote" },
      { label: "Contact Sales Team", href: "/contact" },
    ],
  },

  // 5. Shipping & Delivery
  {
    patterns: [/\bshipping\b/i, /\bdelivery\b/i, /\bdispatch\b/i, /\bcourier\b/i, /\bbluedart\b/i, /\bhow long\b/i, /\bwhen.*arrive\b/i],
    response:
      "Orders placed before 2:00 PM IST qualify for same-day dispatch! We ship nationwide across India using express carriers (Blue Dart, Delhivery Air, DTDC). Standard transit time is 1–3 business days.",
    avatarMood: "happy",
    quickActions: [
      { label: "View Shipping Policy", href: "/shipping-policy" },
      { label: "Check Delivery Timeline", href: "/delivery" },
    ],
  },

  // 6. Order Tracking & Status
  {
    patterns: [/\btrack\b/i, /\border status\b/i, /\bwhere.*order\b/i, /\border\b/i, /\bconsignment\b/i],
    response:
      "You can track your active orders directly in your account dashboard. You'll also receive live SMS & email tracking links as soon as your shipment is dispatched from our central warehouse.",
    avatarMood: "thinking",
    quickActions: [
      { label: "My Orders Dashboard", href: "/orders" },
      { label: "Login to Account", href: "/login" },
    ],
  },

  // 7. Returns & Warranty
  {
    patterns: [/\breturn\b/i, /\bwarranty\b/i, /\breplacement\b/i, /\bdefective\b/i, /\bguarantee\b/i],
    response:
      "All electronic controllers, drives, and active automation hardware carry a 1-Year Manufacturer Warranty. We offer hassle-free replacement for transit damage or defective units reported within 7 days.",
    avatarMood: "happy",
    quickActions: [
      { label: "Refund & Return Policy", href: "/refund-policy" },
      { label: "Support Contact", href: "/contact" },
    ],
  },

  // 8. Human Support / WhatsApp / Phone
  {
    patterns: [/\bhuman\b/i, /\bcall\b/i, /\bphone\b/i, /\bwhatsapp\b/i, /\bcontact\b/i, /\btalk to\b/i, /\bsupport\b/i],
    response:
      "Our automation support specialists are available Monday to Saturday, 9:30 AM to 6:30 PM IST. You can reach out via WhatsApp, phone, or our online inquiry form.",
    avatarMood: "excited",
    quickActions: [
      { label: "Get in Touch", href: "/contact" },
      { label: "Browse FAQs", href: "/faq" },
    ],
  },

  // 9. Greetings
  {
    patterns: [/\bhi\b/i, /\bhello\b/i, /\bhey\b/i, /\bgreetings\b/i, /\bgood morning\b/i, /\bgood afternoon\b/i],
    response:
      "Hello! 👋 I'm Kilby, your OM Automation companion. What component or spec sheet are you looking for today? Feel free to ask about PLCs, VFDs, sensors, or bulk quotes!",
    avatarMood: "happy",
    quickActions: [
      { label: "Search Products", href: "/products" },
      { label: "Request a Quote", href: "/quote" },
    ],
  },
];

export function getBotResponse(userQuery: string): {
  text: string;
  avatarMood: "happy" | "thinking" | "excited" | "celebrate" | "confused" | "proud";
  quickActions?: { label: string; href?: string; query?: string }[];
} {
  const query = userQuery.trim().toLowerCase();

  for (const entry of KNOWLEDGE_BASE) {
    if (entry.patterns.some((pattern) => pattern.test(query))) {
      return {
        text: entry.response,
        avatarMood: entry.avatarMood,
        quickActions: entry.quickActions,
      };
    }
  }

  // Fallback response with search option
  return {
    text: `I'd love to help you find that! We have over 10,000+ precision automation components in our catalog. You can search directly or request custom sourcing from our engineering desk.`,
    avatarMood: "thinking",
    quickActions: [
      { label: `Search "${userQuery.slice(0, 20)}"`, href: `/products?search=${encodeURIComponent(userQuery)}` },
      { label: "Submit Custom RFQ", href: "/quote" },
      { label: "Contact Engineering", href: "/contact" },
    ],
  };
}
