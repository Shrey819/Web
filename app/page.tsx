import { HeroSection } from "@/components/home/HeroSection";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { SolutionsShowcase } from "@/components/home/SolutionsShowcase";
import { WhyBuyFromUs } from "@/components/home/WhyBuyFromUs";
import { StickyShowcase } from "@/components/home/StickyShowcase";
import { BestSellersRail } from "@/components/home/BestSellersRail";
import { StatsSection } from "@/components/home/StatsSection";
import { PromoBanner } from "@/components/home/PromoBanner";
import { Testimonials } from "@/components/home/Testimonials";
import { SpecComparePreview } from "@/components/home/SpecComparePreview";
import { ResourceHub } from "@/components/home/ResourceHub";
import { FAQSection } from "@/components/home/FAQSection";
import { ProductAssemblySection } from "@/components/home/ProductAssembly/ProductAssemblySection";
import { getActiveProducts } from "@/lib/storefront";

export default async function HomePage() {
  const dbProducts = await getActiveProducts();

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1 & 2. Announcement Bar & Hero Section */}
      <HeroSection />

      {/* 3. Trusted Brand OEM Marquee */}
      <BrandMarquee />

      {/* 4. Core Hardware Categories */}
      <CategoryGrid />

      {/* 5. Featured Products Grid */}
      <FeaturedProducts initialProducts={dbProducts} />

      {/* 6. Industrial Solutions Showcase */}
      <SolutionsShowcase />

      {/* 7. Precision Product Assembly (Scroll-Driven Interactive Story) */}
      <ProductAssemblySection />

      {/* 8. Why Buy From Us */}
      <WhyBuyFromUs />

      {/* 8. Product Story / Sticky Showcase */}
      <StickyShowcase />

      {/* 9. Best Sellers Horizontal Rail */}
      <BestSellersRail />

      {/* 10. Statistics Section */}
      <StatsSection />

      {/* 11. Promotional Banner */}
      <PromoBanner />

      {/* 12. Customer Testimonials */}
      <Testimonials />

      {/* 13. Product Comparison Preview */}
      <SpecComparePreview />

      {/* 14. Technical Resource Hub */}
      <ResourceHub />

      {/* 15 & 16. Accessible FAQ Section & Newsletter integrated in Footer */}
      <FAQSection />
    </div>
  );
}
