import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reelmark Hero Showcase | Interactive Landing Hero",
  description:
    "Interactive single-screen hero section for Reelmark with 3D cylinder curved video carousel, drag momentum physics, and soft mint studio aesthetic.",
};

export default function ReelmarkPage() {
  return (
    <main className="min-h-screen bg-[#F5F8EF] flex flex-col items-center justify-center p-0 m-0 overflow-hidden relative">
      {/* Top Bar Bar with Quick Switcher & Open Fullscreen */}
      <div className="w-full bg-[#08482D] text-white px-4 py-2.5 flex items-center justify-between text-xs font-medium z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#DAE7C7]"></span>
          <span className="font-semibold tracking-wide">Reelmark Showcase — Testing & Tasting Mode</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/reelmark.html"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#DAE7C7] text-[#08482D] px-3 py-1 rounded-full font-semibold hover:bg-white transition-colors"
          >
            Open Standalone Hero ↗
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="w-full flex-1 h-[calc(100vh-42px)] relative">
        <iframe
          src="/reelmark.html"
          title="Reelmark Hero"
          className="w-full h-full border-0 block"
          allow="autoplay"
        />
      </div>
    </main>
  );
}
