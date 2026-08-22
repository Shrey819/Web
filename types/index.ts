export interface ProductSpecification {
  label: string;
  value: string;
}

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary?: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
}

export interface SpecificationGroup {
  groupName: string;
  attributes: { label: string; value: string }[];
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortName?: string;
  brand: string;
  manufacturer?: string;

  categoryId: string;
  categoryIds?: string[];
  subcategoryId: string;
  productFamily?: string;

  description: string;
  shortDescription: string;
  images: ProductImage[];

  basePrice: number;
  compareAtPrice?: number;
  gstRate: number;
  priceIncludesTax: boolean;

  stockStatus: "in-stock" | "low-stock" | "out-of-stock" | "made-to-order";
  stockQuantity?: number;
  minimumOrderQuantity: number;
  maximumOrderQuantity?: number;

  unit: "piece" | "pack" | "set" | "box" | "litre";
  packSize: number;
  unitLabel: string;

  hasVariants: boolean;
  variants: ProductVariant[];

  specifications: SpecificationGroup[];
  applications: string[];
  features: string[];

  rating: number;
  reviewCount: number;

  badges: string[];
  datasheetUrl?: string;
  drawingUrl?: string;
  videoUrl?: string;

  shippingWeight?: number;
  shippingDimensions?: {
    length: number;
    width: number;
    height: number;
    unit: "mm" | "cm";
  };

  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  itemCount: number;
  accentColor: string;
  badge: string;
  image: string;
  subcategories: string[];
}

export interface Brand {
  id: string;
  name: string;
  tagline: string;
  country: string;
  featuredCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
}

export interface ResourceArticle {
  id: string;
  slug: string;
  title: string;
  category: "Buying Guide" | "Technical Guide" | "Automation Trends" | "Case Study";
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  summary: string;
  content: string[];
  image: string;
  tags: string[];
}

export interface FAQItem {
  id: string;
  category: "Orders & Shipping" | "Technical Support" | "Bulk Quotations" | "Warranty & Returns";
  question: string;
  answer: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  modelNumber: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderTimeline {
  status: string;
  date: string;
  description: string;
  completed: boolean;
}

export interface Order {
  id: string;
  date: string;
  status: "Processing" | "Shipped" | "Delivered" | "Quote Requested";
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: {
    fullName: string;
    companyName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  trackingNumber?: string;
  timeline: OrderTimeline[];
}

export * from "./auth";

