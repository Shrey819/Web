import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { QuickViewModal } from "@/components/product/QuickViewModal";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { HeaderFooterWrapper } from "@/components/layout/HeaderFooterWrapper";
import { UserTracker } from "@/components/layout/UserTracker";

import { 
  getSiteUrl, 
  generateOrganizationJsonLd, 
  generateWebSiteJsonLd 
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OM AUTOMATION | Premium Industrial Automation Parts & Systems",
    template: "%s | OM AUTOMATION",
  },
  description:
    "B2B e-commerce platform for high-precision sensors, PLCs, industrial controllers, variable frequency drives, ballscrews, linear guideways, and servo motors. Same-day dispatch across India.",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "OM AUTOMATION | Industrial Automation E-Commerce",
    description:
      "Factory direct sensors, PLCs, VFDs, ballscrews, and motion hardware with same-day dispatch across India.",
    url: siteUrl,
    siteName: "OM AUTOMATION",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OM AUTOMATION | Industrial Automation E-Commerce",
    description:
      "Factory direct sensors, PLCs, VFDs, ballscrews, and motion hardware with same-day dispatch across India.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = generateOrganizationJsonLd();
  const websiteJsonLd = generateWebSiteJsonLd();

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Global Organization Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(orgJsonLd),
          }}
        />
        {/* Global WebSite SearchAction Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.target && m.target.hasAttribute && m.target.hasAttribute('fdprocessedid')) {
                        m.target.removeAttribute('fdprocessedid');
                      }
                    }
                  });
                  if (document.documentElement) {
                    observer.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['fdprocessedid'] });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#faf9f5] text-slate-900 selection:bg-sky-500 selection:text-white" suppressHydrationWarning>
        <UserTracker />
        <HeaderFooterWrapper>
          {children}
        </HeaderFooterWrapper>

        {/* Global Drawers, Modals & Toast Overlays */}
        <CartDrawer />
        <QuickViewModal />
        <ToastContainer />
      </body>
    </html>
  );
}
