import { HeroSlider } from "@/components/home/HeroSlider";
import { HomepageCategoryShowcase } from "@/components/home/HomepageCategoryShowcase";
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
import { CinematicProductSection } from "@/components/cinematic";
import { getActiveProducts, getStorefrontCategories } from "@/lib/storefront";
import { getHomepageData } from "@/lib/homepage";

export default async function HomePage() {
  const [homepageData, dbCategories, dbProducts] = await Promise.all([
    getHomepageData(),
    getStorefrontCategories(),
    getActiveProducts(),
  ]);

  // Build category showcase resolved list
  const showcaseSections = homepageData.categoryShowcases
    .filter((showcase) => showcase.isActive)
    .map((showcase, index) => {
      const matchedCat = dbCategories.find(
        (c) => c.id === showcase.categoryId || c.slug === showcase.categoryId
      );

      const catName = matchedCat?.name || `Featured Category #${index + 1}`;
      const catSlug = matchedCat?.slug || showcase.categoryId || "products";

      // Filter active products matching category
      let categoryProducts = dbProducts.filter((p) => {
        if (!matchedCat) return true;
        return (
          p.categoryId === matchedCat.id ||
          p.categoryId === matchedCat.slug ||
          p.categoryIds?.includes(matchedCat.id) ||
          p.categoryIds?.includes(matchedCat.slug)
        );
      });

      // Fallback: if category has no specific products yet, provide fallback products
      if (categoryProducts.length === 0 && dbProducts.length > 0) {
        // Slice different chunks so carousels look distinct
        const start = (index * 4) % dbProducts.length;
        categoryProducts = dbProducts.slice(start, start + 8);
        if (categoryProducts.length < 4) {
          categoryProducts = dbProducts.slice(0, 8);
        }
      }

      return {
        showcase,
        categoryName: catName,
        categorySlug: catSlug,
        products: categoryProducts,
      };
    });

  return (
    <div className="flex flex-col min-h-screen">
      {/* 2. Full-Width Premium Hero Image Slider (3 slides, responsive desktop/mobile images) */}
      <HeroSlider slides={homepageData.heroSlides} />

      {/* 4, 5, 6. Category Product Showcase Sections (3 Admin-Controlled Showcases) */}
      <div className="bg-[#faf9f5]">
        {showcaseSections.map((sec, idx) => (
          <HomepageCategoryShowcase
            key={sec.showcase.id || idx}
            showcase={sec.showcase}
            categoryName={sec.categoryName}
            categorySlug={sec.categorySlug}
            products={sec.products}
          />
        ))}
      </div>

      {/* OEM Brand Marquee */}
      <BrandMarquee />

      {/* Cinematic Product Showcase */}
      <CinematicProductSection />

      {/* Core Hardware Categories */}
      <CategoryGrid />

      {/* Featured Products Grid */}
      <FeaturedProducts initialProducts={dbProducts} />

      {/* Industrial Solutions Showcase */}
      <SolutionsShowcase />

      {/* Precision Product Assembly */}
      <ProductAssemblySection />

      {/* Why Buy From Us */}
      <WhyBuyFromUs />

      {/* Sticky Showcase */}
      <StickyShowcase />

      {/* Best Sellers Horizontal Rail */}
      <BestSellersRail />

      {/* Statistics Section */}
      <StatsSection />

      {/* Promotional Banner */}
      <PromoBanner />

      {/* Customer Testimonials */}
      <Testimonials />

      {/* Product Comparison Preview */}
      <SpecComparePreview />

      {/* Technical Resource Hub */}
      <ResourceHub />

      {/* Accessible FAQ Section */}
      <FAQSection />
    </div>
  );
}
