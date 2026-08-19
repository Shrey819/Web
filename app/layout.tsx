import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { QuickViewModal } from "@/components/product/QuickViewModal";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { HeaderFooterWrapper } from "@/components/layout/HeaderFooterWrapper";
import { UserTracker } from "@/components/layout/UserTracker";

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

export const metadata: Metadata = {
  title: "Propel Auto | Premium Industrial Automation Parts & Systems",
  description: "B2B e-commerce platform for high-precision sensors, PLCs, industrial controllers, variable frequency drives, and servo motors. Same-day dispatch.",
  openGraph: {
    title: "Propel Auto | Industrial Automation E-Commerce",
    description: "Factory direct sensors, PLCs, VFDs, and motion hardware with 24-hour dispatch.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
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
