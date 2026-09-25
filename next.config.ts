import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const siteHost = process.env.NEXT_PUBLIC_SITE_URL
  ? (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SITE_URL).host;
      } catch {
        return "omautomation.com";
      }
    })()
  : "omautomation.com";

const serverActionsAllowedOrigins = isDev
  ? [
      "*.ngrok-free.app",
      "*.ngrok-free.dev",
      "*.ngrok.app",
      "*.ngrok.io",
      "localhost:3000",
      "localhost",
    ]
  : [
      siteHost,
      "omautomation.com",
      "www.omautomation.com",
    ];

export function buildContentSecurityPolicy(isDevEnv: boolean = isDev): string {
  const policies: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://accounts.google.com",
      "https://checkout.razorpay.com",
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
    ],
    "font-src": [
      "'self'",
      "data:",
      "https://fonts.gstatic.com",
    ],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://res.cloudinary.com",
      "https://images.unsplash.com",
      "https://lh3.googleusercontent.com",
      "https://*.googleusercontent.com",
      "https://*.razorpay.com",
    ],
    "media-src": [
      "'self'",
      "data:",
      "blob:",
      "https://res.cloudinary.com",
    ],
    "connect-src": [
      "'self'",
      "https://accounts.google.com",
      "https://api.razorpay.com",
      "https://lumberjack.razorpay.com",
      "https://api.cloudinary.com",
      "https://res.cloudinary.com",
      "ws:",
      "wss:",
    ],
    "frame-src": [
      "'self'",
      "https://accounts.google.com",
      "https://api.razorpay.com",
      "https://checkout.razorpay.com",
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
    ],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'", "https://accounts.google.com"],
    "frame-ancestors": ["'none'"],
  };

  const directives = Object.entries(policies).map(
    ([directive, sources]) => `${directive} ${sources.join(" ")};`
  );

  if (!isDevEnv) {
    directives.push("upgrade-insecure-requests;");
  }

  return directives.join(" ");
}

export const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy(isDev),
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: serverActionsAllowedOrigins,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
          {
            key: "ngrok-skip-browser-warning",
            value: "69420",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
