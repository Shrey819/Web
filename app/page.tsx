import { MainframeHero } from "@/components/home/MainframeHero";
import { HeroSlider } from "@/components/home/HeroSlider";
import { HomepageCategoryShowcase } from "@/components/home/HomepageCategoryShowcase";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { TopFundamentals } from "@/components/home/TopFundamentals";
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
import { getHomepageData } from "@/lib/homepage-server";

import { DEFAULT_SECTION_ORDER, getBaseSectionId, getSectionInstanceData } from "@/lib/homepage";

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

  const rawSectionOrder = homepageData.sectionOrder || DEFAULT_SECTION_ORDER;
  let sectionOrder = [...rawSectionOrder];
  if (!sectionOrder.includes("sec-top-fundamentals")) {
    const catGridIndex = sectionOrder.indexOf("sec-categories-grid");
    if (catGridIndex !== -1) {
      sectionOrder.splice(catGridIndex + 1, 0, "sec-top-fundamentals");
    } else {
      sectionOrder.push("sec-top-fundamentals");
    }
  }

  const hiddenIds = new Set(homepageData.hiddenSectionIds || []);

  const renderSection = (id: string) => {
    if (hiddenIds.has(id)) return null;
    const baseId = getBaseSectionId(id);
    const instanceData = getSectionInstanceData(id, homepageData);

    switch (baseId) {
      case "sec-mainframe":
        return <MainframeHero key={id} config={instanceData} />;

      case "sec-slider": {
        const slides = Array.isArray(instanceData)
          ? instanceData
          : instanceData?.heroSlides || homepageData.heroSlides;
        return <HeroSlider key={id} slides={slides} />;
      }

      case "sec-showcases": {
        const customShowcases = Array.isArray(instanceData)
          ? instanceData
          : instanceData?.categoryShowcases || homepageData.categoryShowcases;

        const resolvedShowcaseSections = customShowcases
          .filter((showcase: any) => showcase.isActive)
          .map((showcase: any, index: number) => {
            const matchedCat = dbCategories.find(
              (c) => c.id === showcase.categoryId || c.slug === showcase.categoryId
            );
            const catName = matchedCat?.name || showcase.customTitle || `Featured Category #${index + 1}`;
            const catSlug = matchedCat?.slug || showcase.categoryId || "products";
            let categoryProducts = dbProducts.filter((p) => {
              if (!matchedCat) return true;
              return (
                p.categoryId === matchedCat.id ||
                p.categoryId === matchedCat.slug ||
                p.categoryIds?.includes(matchedCat.id) ||
                p.categoryIds?.includes(matchedCat.slug)
              );
            });
            if (categoryProducts.length === 0 && dbProducts.length > 0) {
              const start = (index * 4) % dbProducts.length;
              categoryProducts = dbProducts.slice(start, start + 8);
              if (categoryProducts.length < 4) categoryProducts = dbProducts.slice(0, 8);
            }
            return { showcase, categoryName: catName, categorySlug: catSlug, products: categoryProducts };
          });

        return (
          <div key={id} className="bg-[#faf9f5]">
            {resolvedShowcaseSections.map((sec: any, idx: number) => (
              <HomepageCategoryShowcase
                key={sec.showcase.id || idx}
                showcase={sec.showcase}
                categoryName={sec.categoryName}
                categorySlug={sec.categorySlug}
                products={sec.products}
              />
            ))}
          </div>
        );
      }

      case "sec-brand-marquee":
        return <BrandMarquee key={id} config={instanceData} />;

      case "sec-cinematic":
        return <CinematicProductSection key={id} config={instanceData} />;

      case "sec-categories-grid":
        return <CategoryGrid key={id} config={instanceData} />;

      case "sec-top-fundamentals":
        return <TopFundamentals key={id} config={instanceData} />;

      case "sec-featured-catalog":
        return <FeaturedProducts key={id} initialProducts={dbProducts} config={instanceData} />;

      case "sec-solutions":
        return <SolutionsShowcase key={id} config={instanceData} />;

      case "sec-assembly":
        return <ProductAssemblySection key={id} />;

      case "sec-why-buy": {
        const items = instanceData.whyBuy || instanceData.whyBuyFromUs || homepageData.whyBuy;
        const eyebrow = instanceData.whyBuyEyebrow || homepageData.whyBuyEyebrow;
        const title = instanceData.whyBuyTitle || homepageData.whyBuyTitle;
        return (
          <WhyBuyFromUs
            key={id}
            items={items}
            eyebrow={eyebrow}
            title={title}
          />
        );
      }

      case "sec-sticky-showcase":
        return <StickyShowcase key={id} config={instanceData} />;

      case "sec-best-sellers":
        return <BestSellersRail key={id} config={instanceData} />;

      case "sec-stats": {
        const stats = Array.isArray(instanceData)
          ? instanceData
          : instanceData?.stats || homepageData.stats;
        return <StatsSection key={id} stats={stats} />;
      }

      case "sec-promo-banner":
        return <PromoBanner key={id} config={instanceData} />;

      case "sec-testimonials": {
        const testimonials = instanceData.testimonials || homepageData.testimonials;
        const eyebrow = instanceData.testimonialsEyebrow || homepageData.testimonialsEyebrow;
        const title = instanceData.testimonialsTitle || homepageData.testimonialsTitle;
        return (
          <Testimonials
            key={id}
            testimonials={testimonials}
            eyebrow={eyebrow}
            title={title}
          />
        );
      }

      case "sec-compare":
        return <SpecComparePreview key={id} config={instanceData} />;

      case "sec-resource-hub":
        return <ResourceHub key={id} config={instanceData} />;

      case "sec-faqs": {
        const faqs = instanceData.faqs || homepageData.faqs;
        const eyebrow = instanceData.faqsEyebrow || homepageData.faqsEyebrow;
        const title = instanceData.faqsTitle || homepageData.faqsTitle;
        return (
          <FAQSection
            key={id}
            faqs={faqs}
            eyebrow={eyebrow}
            title={title}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {sectionOrder.map((id) => renderSection(id))}
    </div>
  );
}
