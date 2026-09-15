/**
 * Data Transfer Objects (DTOs) for Secure Data Access Layer (DAL)
 *
 * Security Principles:
 * 1. Allowlist Projection: Each DTO exposes only explicitly vetted fields.
 * 2. Secrets Exclusion: Password hashes, private API keys, session tokens,
 *    and OAuth secrets are strictly omitted.
 * 3. Boundary Isolation: Customer views are separated from Admin views.
 */

export const DAL_DTO_VERSION = "1.0.0";

export interface CustomerProfileDTO {
  id: string;
  name: string | null;
  email: string;
  role?: "CUSTOMER" | "ADMIN";
  companyName: string;
  image: string | null;
  createdAt: string | null;
}

export interface CustomerAddressDTO {
  id: string;
  userId: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  type: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressInput {
  userId?: string;
  fullName: string;
  companyName?: string | null;
  email?: string | null;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string | null;
  type?: string | null;
  isDefault?: boolean;
}

export interface OrderItemDTO {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  attributes: { name: string; value: string }[];
  buyerNote: string | null;
}

export interface CustomerOrderSummaryDTO {
  id: string;
  date: string;
  status: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  itemCount: number;
  paymentMethod: string;
  paymentReference: string;
  carrier: string;
  trackingNumber: string;
  etd: string | null;
}

export interface CustomerOrderDetailDTO {
  id: string;
  status: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  shippingFullName: string;
  shippingCompany: string | null;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  shippingPhone: string;
  paymentMethod: string;
  paymentReference: string;
  paymentStatus: string;
  carrier: string;
  trackingNumber: string;
  awbCode?: string | null;
  invoiceUrl?: string | null;
  etd: string | null;
  shipmentCurrentStatus?: string | null;
  trackingData?: any;
  createdAt: string;
  items: OrderItemDTO[];
}

export interface AdminOrderDetailDTO extends CustomerOrderDetailDTO {
  shiprocketOrderId?: string | null;
  shiprocketShipmentId?: string | null;
  awbCode?: string | null;
  courierName?: string | null;
  labelUrl?: string | null;
  invoiceUrl?: string | null;
  manifestUrl?: string | null;
  pickupTokenNumber?: string | null;
  pickupScheduledDate?: string | null;
  originalPaymentMethod?: string | null;
}

export interface AdminOrderSummaryDTO extends CustomerOrderSummaryDTO {
  shippingFullName: string;
  shippingCompany: string | null;
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  shippingPhone: string;
  createdAt: string;
  originalPaymentMethod: string;
  paymentStatus: string;
  shiprocketOrderId?: string | null;
  shiprocketShipmentId?: string | null;
  awbCode?: string | null;
  courierName?: string | null;
  labelUrl?: string | null;
  invoiceUrl?: string | null;
  manifestUrl?: string | null;
  pickupTokenNumber?: string | null;
  pickupScheduledDate?: string | null;
  shipmentCurrentStatus?: string | null;
  trackingData?: any;
  items: OrderItemDTO[];
}

export interface AdminUserDTO {
  id: string;
  name: string | null;
  email: string | null;
  role: "ADMIN" | "CUSTOMER";
  image: string | null;
  avatar: string | null;
  google_sub: string | null;
  given_name?: string | null;
  family_name?: string | null;
  locale?: string | null;
  hasPassword: boolean;
  createdAt: string;
  emailVerified: string | null;
}
