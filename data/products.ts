import { Product } from "@/types";
import curatedCatalog from "./catalog-curated.json";

export const PRODUCTS: Product[] = curatedCatalog as Product[];

// Mock pagination utility to be used later for testing the full catalog
export async function fetchFullCatalog(page: number, limit: number): Promise<{ products: Product[], total: number }> {
  const fullCatalog = await import('./catalog-full.json').then(mod => mod.default);
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    products: fullCatalog.slice(startIndex, endIndex) as Product[],
    total: fullCatalog.length
  };
}
