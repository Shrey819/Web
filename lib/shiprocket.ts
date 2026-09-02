import { getSystemSettings } from "@/lib/settings";
import { query } from "@/lib/db";

const DEFAULT_SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";

export function getShiprocketApiBase(): string {
  const envBase = process.env.SHIPROCKET_API_BASE;
  if (!envBase || envBase.trim() === "") {
    return DEFAULT_SHIPROCKET_API_BASE;
  }
  let base = envBase.trim().replace(/\/+$/, "");
  // If user provides just "https://apiv2.shiprocket.in" append "/v1/external"
  if (!base.includes("/v1/external") && !base.includes("/v1/")) {
    base = `${base}/v1/external`;
  }
  return base;
}

// In-memory token cache
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export interface CourierServiceabilityResponse {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  base_rate?: number;
  whatsapp_charges?: number;
  etd: string;
  estimated_delivery_days?: string;
  rating?: number;
  is_cod?: boolean;
  min_weight?: number;
  call_courier?: boolean;
  rto_charges?: number;
  mode?: "Air" | "Surface" | "Standard";
  pickup_date?: string;
  is_recommended?: boolean;
  chargeable_weight?: number;
  city?: string;
  state?: string;
}

export interface ShiprocketPickupLocation {
  id: number;
  pickup_location: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  is_primary_location: boolean;
}

export interface DeliveryRangeResult {
  startDate: string;
  endDate: string;
  formattedDateRange: string;
  formattedDaysRange: string;
  fullLabel: string;
  minDays: number;
  maxDays: number;
}

/**
 * Calculates a delivery time range with +2 days free time / buffer window
 */
export function calculateDeliveryDateRange(
  rawEtd?: string | null,
  pincode?: string | null
): DeliveryRangeResult {
  const now = new Date();

  let minDays = 3;
  let maxDays = 5; // Default: 3 + 2 buffer = 5 days

  if (rawEtd && typeof rawEtd === "string") {
    const trimmed = rawEtd.trim();
    // Check if rawEtd is a parseable date string like "2026-09-04" or "04-09-2026"
    const isIsoOrStandardDate = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(trimmed);
    if (isIsoOrStandardDate) {
      const parsedDate = new Date(trimmed);
      if (!isNaN(parsedDate.getTime())) {
        const diffMs = parsedDate.getTime() - now.getTime();
        const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        minDays = diffDays;
        maxDays = minDays + 2; // +2 days buffer
      }
    } else {
      // Extract numbers from strings like "2-3 days", "3-5", "2"
      const numberMatches = trimmed.match(/\d+/g);
      if (numberMatches && numberMatches.length > 0) {
        const baseMin = parseInt(numberMatches[0], 10);
        if (!isNaN(baseMin) && baseMin > 0) {
          minDays = baseMin;
          maxDays = minDays + 2; // +2 days buffer
        }
      }
    }
  } else if (pincode && typeof pincode === "string") {
    const pin = pincode.trim();
    const isLocalGujarat = pin.startsWith("36") || pin.startsWith("38") || pin.startsWith("39");
    minDays = isLocalGujarat ? 2 : 3;
    maxDays = minDays + 2;
  }

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + minDays);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 2); // +2 days free time / range buffer

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };

  const startFormatted = startDate.toLocaleDateString("en-US", dateOptions);
  const endFormatted = endDate.toLocaleDateString("en-US", dateOptions);
  const startShort = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endShort = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return {
    startDate: startShort,
    endDate: endShort,
    formattedDateRange: `${startFormatted} – ${endFormatted}`,
    formattedDaysRange: `${minDays} - ${maxDays} Business Days`,
    fullLabel: `${startFormatted} – ${endFormatted} (${minDays} - ${maxDays} Business Days)`,
    minDays,
    maxDays,
  };
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number | string;
}

export interface CreateShiprocketOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location?: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: "Prepaid" | "COD";
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface TrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
  "sr-status"?: string;
}

export interface TrackingResult {
  track_status: number;
  shipment_status: number;
  shipment_track?: Array<{
    id: number;
    awb_code: string;
    courier_company_id: number;
    courier_name: string;
    current_status: string;
    origin: string;
    destination: string;
    consignee_name: string;
    packages: number;
    weight: string;
    edd: string;
    pickup_date: string;
    delivered_date?: string;
  }>;
  shipment_track_activities?: TrackingActivity[];
  track_url?: string;
}

/**
 * Obtain Shiprocket JWT Auth Token
 * Authenticates via POST /v1/external/auth/login and caches the token.
 * Token is valid for 10 days (240 hours).
 */
export async function getShiprocketToken(forceRefresh = false): Promise<string> {
  const now = Date.now();

  // Return cached token if valid for at least 1 more hour
  if (!forceRefresh && cachedToken && tokenExpiresAt > now + 3600 * 1000) {
    return cachedToken;
  }

  // Check database settings for cached token first
  if (!forceRefresh) {
    try {
      const dbTokenRes = await query(
        `SELECT value FROM "SystemSetting" WHERE key = 'shiprocket_token' LIMIT 1`
      );
      const dbExpiryRes = await query(
        `SELECT value FROM "SystemSetting" WHERE key = 'shiprocket_token_expiry' LIMIT 1`
      );

      const dbToken = dbTokenRes.rows[0]?.value;
      const dbExpiry = Number(dbExpiryRes.rows[0]?.value || 0);

      if (dbToken && typeof dbToken === "string" && dbExpiry > now + 3600 * 1000) {
        cachedToken = dbToken;
        tokenExpiresAt = dbExpiry;
        return dbToken;
      }
    } catch (e) {
      console.warn("Could not read cached token from DB:", e);
    }
  }

  const settings = await getSystemSettings();
  const email = settings.shiprocket_email || process.env.SHIPROCKET_EMAIL;
  const password = settings.shiprocket_password || process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Shiprocket API credentials missing. Please configure your Shiprocket API User Email and Password in Admin Settings."
    );
  }

  const baseUrl = getShiprocketApiBase();
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email.trim(), password: password.trim() }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData.message || errorData.error || `HTTP ${res.status}: ${res.statusText}`;

    // Graceful fallback: check if we have an existing cached token in the database
    try {
      const fallbackTokenRes = await query(`SELECT value FROM "SystemSetting" WHERE key = 'shiprocket_token' LIMIT 1`);
      const fallbackToken = fallbackTokenRes.rows[0]?.value;
      if (fallbackToken && typeof fallbackToken === "string" && fallbackToken.length > 20) {
        console.warn("[Shiprocket] Fresh login failed, using valid cached DB token:", message);
        cachedToken = fallbackToken;
        return fallbackToken;
      }
    } catch (e) {}

    throw new Error(`Shiprocket Authentication Failed: ${message}`);
  }

  const data = await res.json();
  const token = data.token;

  if (!token) {
    throw new Error("Shiprocket authentication response did not contain a valid JWT token.");
  }

  // Cache token (valid for ~9.5 days to be safe)
  cachedToken = token;
  tokenExpiresAt = now + 9.5 * 24 * 60 * 60 * 1000;

  try {
    await query(
      `INSERT INTO "SystemSetting" ("key", "value", "updatedAt") 
       VALUES ('shiprocket_token', $1, CURRENT_TIMESTAMP) 
       ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP`,
      [token]
    );
    await query(
      `INSERT INTO "SystemSetting" ("key", "value", "updatedAt") 
       VALUES ('shiprocket_token_expiry', $1, CURRENT_TIMESTAMP) 
       ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP`,
      [String(tokenExpiresAt)]
    );
  } catch (e) {
    console.warn("Could not persist Shiprocket token to DB:", e);
  }

  return token;
}

/**
 * Execute an authenticated Shiprocket API request with automatic token retry
 */
async function shiprocketFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const token = await getShiprocketToken(retried);
  const baseUrl = getShiprocketApiBase();
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));

  // If token expired or invalid (401 or token_expired message), refresh token and retry once
  const isTokenExpired =
    res.status === 401 ||
    json.message === "token_expired" ||
    json.message === "Token has expired" ||
    json.message === "Invalid Token" ||
    json.error === "token_expired";

  if (isTokenExpired && !retried) {
    console.warn("[Shiprocket] Token expired / invalid encountered. Refreshing token and retrying...");
    return shiprocketFetch<T>(endpoint, options, true);
  }

  if (!res.ok) {
    const errorMsg =
      json.message ||
      (Array.isArray(json.errors) ? json.errors.join(", ") : null) ||
      (typeof json.errors === "object" ? JSON.stringify(json.errors) : null) ||
      `Shiprocket API Error (HTTP ${res.status})`;
    throw new Error(errorMsg);
  }

  return json as T;
}

/**
 * Fetch all registered pickup locations from Shiprocket
 * GET /v1/external/settings/company/pickup
 */
export async function getShiprocketPickupLocations(): Promise<ShiprocketPickupLocation[]> {
  try {
    const res = await shiprocketFetch<{
      data?: {
        shipping_address?: any[];
      };
    }>("/settings/company/pickup");

    const addresses: any[] = res.data?.shipping_address || [];

    const mapped: ShiprocketPickupLocation[] = addresses.map((a: any) => ({
      id: Number(a.id),
      pickup_location: String(a.pickup_location || "warehouse"),
      name: String(a.name || "Om Automation"),
      email: String(a.email || ""),
      phone: String(a.phone || ""),
      address: String(a.address || ""),
      address_2: String(a.address_2 || ""),
      city: String(a.city || "Rajkot"),
      state: String(a.state || "Gujarat"),
      country: String(a.country || "India"),
      pin_code: String(a.pin_code || "360003"),
      is_primary_location: Boolean(a.is_primary_location === 1 || a.is_primary_location === true),
    }));

    // Sort so primary location is always first
    return mapped.sort((a, b) => (b.is_primary_location ? 1 : 0) - (a.is_primary_location ? 1 : 0));
  } catch (error) {
    console.error("[Shiprocket] Failed to fetch pickup locations:", error);
    return [
      {
        id: 102860753,
        pickup_location: "warehouse",
        name: "Om Automation",
        email: "try.shrey@gmail.com",
        phone: "8530478239",
        address: "C1B, 271, R Rd, near Turbo Bearing, Aji GIDC",
        city: "Rajkot",
        state: "Gujarat",
        country: "India",
        pin_code: "360003",
        is_primary_location: true,
      },
    ];
  }
}

/**
 * Check Courier Serviceability & Rates for a Destination Pincode
 * GET /v1/external/courier/serviceability/
 */
export async function checkCourierServiceability(params: {
  pickup_postcode?: string;
  delivery_postcode: string;
  weight?: number;
  cod?: number | boolean;
  order_id?: string;
  declared_value?: number;
}): Promise<{
  status: number;
  available_courier_companies: CourierServiceabilityResponse[];
  recommended_courier_company_id?: number;
  recommended_courier_name?: string;
  recommended_rate?: number;
  recommended_etd?: string;
  message?: string;
  error?: string;
}> {
  const settings = await getSystemSettings();
  const pickup_postcode = params.pickup_postcode || settings.shiprocket_pickup_pincode || "360003";
  const weight = params.weight ?? settings.shiprocket_default_weight ?? 0.5;
  const isCod = params.cod === true || params.cod === 1 ? 1 : 0;

  const queryParams = new URLSearchParams({
    pickup_postcode: String(pickup_postcode),
    delivery_postcode: String(params.delivery_postcode),
    weight: String(weight),
    cod: String(isCod),
  });

  if (params.declared_value && Number(params.declared_value) > 0) {
    queryParams.set("declared_value", String(params.declared_value));
  }

  try {
    const data = await shiprocketFetch<{
      status: number;
      message?: string;
      data?: {
        available_courier_companies?: any[];
        recommended_courier_company_id?: number;
      };
    }>(`/courier/serviceability/?${queryParams.toString()}`);

    const recommendedId = data.data?.recommended_courier_company_id;

    const couriers: CourierServiceabilityResponse[] = (
      data.data?.available_courier_companies || []
    ).map((c: any) => {
      const name = String(c.courier_name || "Express Courier");
      const isAir = name.toLowerCase().includes("air") || c.mode === 1 || c.is_surface === 0;
      const isSurface = name.toLowerCase().includes("surface") || c.mode === 0 || c.is_surface === 1;
      const mode = isAir ? "Air" : isSurface ? "Surface" : "Standard";
      const isRec = Boolean(c.courier_company_id === recommendedId || c.is_recommended);

      // Extract exact rate matching Shiprocket web portal (c.rate already includes freight + cod_charges when cod=1)
      const baseFreight = Number(c.freight_charge || c.rate || 0);
      const shiprocketCalculatedRate = Number(c.rate || c.freight_charge || 0);
      const whatsappCharges = Number(c.whatsapp_charges || 0);
      const otherCharges = Number(c.other_charges || 0);
      const coverageCharges = Number(c.coverage_charges || 0);
      const entryTax = Number(c.entry_tax || 0);

      const totalCalculatedRate = Math.round((shiprocketCalculatedRate + whatsappCharges + otherCharges + coverageCharges + entryTax) * 100) / 100;

      return {
        courier_company_id: Number(c.courier_company_id),
        courier_name: name,
        rate: totalCalculatedRate,
        base_rate: baseFreight,
        whatsapp_charges: whatsappCharges,
        etd: String(c.etd || c.estimated_delivery_days || "3-5 days"),
        estimated_delivery_days: String(c.estimated_delivery_days || ""),
        rating: Number(c.rating || 4.5),
        is_cod: Boolean(c.is_cod || c.cod === 1),
        min_weight: Number(c.min_weight || 0.5),
        call_courier: Boolean(c.call_courier),
        rto_charges: Number(c.rto_charges || 0),
        mode,
        is_recommended: isRec,
        pickup_date: "Today",
        chargeable_weight: Number(c.chargeable_weight || c.charge_weight || weight),
        city: c.city,
        state: c.state,
      };
    });

    const recommended = couriers.find((c) => c.courier_company_id === recommendedId);

    return {
      status: data.status || 200,
      available_courier_companies: couriers,
      recommended_courier_company_id: recommended?.courier_company_id,
      recommended_courier_name: recommended?.courier_name,
      recommended_rate: recommended?.rate,
      recommended_etd: recommended?.etd,
      message: data.message,
    };
  } catch (error: any) {
    console.error("[Shiprocket] checkCourierServiceability failed:", error);
    return {
      status: 400,
      available_courier_companies: [],
      error: error.message || "Shiprocket rate calculation failed.",
      message: error.message,
    };
  }
}

/**
 * Create Order in Shiprocket (Adhoc)
 * POST /v1/external/orders/create/adhoc
 */
export async function createShiprocketAdhocOrder(
  payload: CreateShiprocketOrderPayload
): Promise<{
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now?: number;
  awb_code?: string;
  courier_company_id?: string;
  courier_name?: string;
}> {
  const settings = await getSystemSettings();
  const finalPayload: CreateShiprocketOrderPayload = {
    ...payload,
    pickup_location: payload.pickup_location || settings.shiprocket_pickup_location || "Primary",
    length: payload.length || settings.shiprocket_default_length || 10,
    breadth: payload.breadth || settings.shiprocket_default_breadth || 10,
    height: payload.height || settings.shiprocket_default_height || 10,
    weight: payload.weight || settings.shiprocket_default_weight || 0.5,
  };

  const response = await shiprocketFetch<{
    order_id: number;
    shipment_id: number;
    status: string;
    status_code: number;
    onboarding_completed_now?: number;
    awb_code?: string;
    courier_company_id?: string;
    courier_name?: string;
  }>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(finalPayload),
  });

  return response;
}

/**
 * Assign Courier & Generate AWB for a Shipment
 * POST /v1/external/courier/assign/awb
 */
export async function assignShiprocketAWB(params: {
  shipment_id: string | number;
  courier_id?: number | string;
}): Promise<{
  awb_code: string;
  courier_name: string;
  courier_company_id: number;
  shipment_id: number;
  routing_code?: string;
  applied_weight?: number;
}> {
  const bodyPayload: any = {
    shipment_id: params.shipment_id,
  };
  if (params.courier_id) {
    bodyPayload.courier_id = params.courier_id;
  }

  const res = await shiprocketFetch<any>("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify(bodyPayload),
  });

  const data = res.response?.data || res.data || res;
  const awbCode = data.awb_code || data.awb_assign_status?.awb_code;

  if (!awbCode) {
    throw new Error(
      res.message || data.awb_assign_error || "Failed to generate AWB code with Shiprocket."
    );
  }

  return {
    awb_code: String(awbCode),
    courier_name: String(data.courier_name || "Express Courier"),
    courier_company_id: Number(data.courier_company_id || 0),
    shipment_id: Number(data.shipment_id || params.shipment_id),
    routing_code: data.routing_code,
    applied_weight: Number(data.applied_weight || 0),
  };
}

/**
 * Request Carrier Pickup
 * POST /v1/external/courier/generate/pickup
 */
export async function generateShiprocketPickup(shipment_id: string | number | (string | number)[]): Promise<{
  pickup_status: number;
  pickup_token_number?: string;
  pickup_scheduled_date?: string;
  data?: any;
}> {
  const shipmentIds = Array.isArray(shipment_id) ? shipment_id : [shipment_id];

  const res = await shiprocketFetch<any>("/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentIds }),
  });

  const responseObj = res.response || res;
  return {
    pickup_status: responseObj.pickup_status ?? 1,
    pickup_token_number: responseObj.pickup_token_number || responseObj.data?.pickup_token_number,
    pickup_scheduled_date: responseObj.pickup_scheduled_date || responseObj.data?.pickup_scheduled_date,
    data: responseObj,
  };
}

/**
 * Generate Shipping Label (PDF)
 * POST /v1/external/courier/generate/label
 */
export async function generateShiprocketLabel(
  shipment_id: string | number | (string | number)[]
): Promise<{
  label_created: number;
  label_url: string;
}> {
  const shipmentIds = Array.isArray(shipment_id) ? shipment_id : [shipment_id];

  const res = await shiprocketFetch<{
    label_created: number;
    label_url: string;
    response?: { label_url?: string };
  }>("/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentIds }),
  });

  const labelUrl = res.label_url || res.response?.label_url;
  if (!labelUrl) {
    throw new Error("Shiprocket did not return a printable label URL.");
  }

  return {
    label_created: res.label_created || 1,
    label_url: labelUrl,
  };
}

/**
 * Generate Order Tax Invoice (PDF)
 * POST /v1/external/orders/print/invoice
 */
export async function generateShiprocketInvoice(
  order_ids: (string | number)[]
): Promise<{
  is_invoice_created: boolean;
  invoice_url: string;
}> {
  const res = await shiprocketFetch<{
    is_invoice_created: boolean;
    invoice_url: string;
  }>("/orders/print/invoice", {
    method: "POST",
    body: JSON.stringify({ ids: order_ids }),
  });

  if (!res.invoice_url) {
    throw new Error("Shiprocket did not return an invoice PDF URL.");
  }

  return {
    is_invoice_created: res.is_invoice_created ?? true,
    invoice_url: res.invoice_url,
  };
}

/**
 * Generate & Print Manifest (PDF)
 * POST /v1/external/manifests/generate
 * POST /v1/external/manifests/print
 */
export async function generateShiprocketManifest(
  shipment_ids: (string | number)[]
): Promise<{
  manifest_url: string;
}> {
  // First call generate
  await shiprocketFetch("/manifests/generate", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipment_ids }),
  }).catch(() => null);

  // Then call print
  const res = await shiprocketFetch<{
    manifest_url?: string;
    data?: { manifest_url?: string };
  }>("/manifests/print", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipment_ids }),
  });

  const url = res.manifest_url || res.data?.manifest_url;
  if (!url) {
    throw new Error("Shiprocket did not return a manifest PDF URL.");
  }

  return { manifest_url: url };
}

/**
 * Real-Time Courier Tracking by AWB
 * GET /v1/external/courier/track/awb/{awb_code}
 */
export async function trackShiprocketAWB(awb_code: string): Promise<TrackingResult> {
  const res = await shiprocketFetch<{
    tracking_data?: TrackingResult;
  }>(`/courier/track/awb/${encodeURIComponent(awb_code)}`);

  if (!res.tracking_data) {
    throw new Error("Tracking data not available for this AWB.");
  }

  return res.tracking_data;
}

/**
 * Real-Time Courier Tracking by Order ID
 * GET /v1/external/courier/track/order/{order_id}
 */
export async function trackShiprocketByOrderId(order_id: string): Promise<TrackingResult> {
  const res = await shiprocketFetch<{
    tracking_data?: TrackingResult;
  }>(`/courier/track/order/${encodeURIComponent(order_id)}`);

  if (!res.tracking_data) {
    throw new Error("Tracking data not available for this Order ID.");
  }

  return res.tracking_data;
}

/**
 * Test Shiprocket Connection & Auth
 */
export async function testShiprocketConnection(): Promise<{
  success: boolean;
  latency?: number;
  email?: string;
  error?: string;
}> {
  const start = Date.now();
  try {
    const settings = await getSystemSettings();
    const email = settings.shiprocket_email || process.env.SHIPROCKET_EMAIL;
    if (!email) {
      return { success: false, error: "Shiprocket API email is not configured." };
    }

    await getShiprocketToken(true); // Force fresh token
    const latency = Date.now() - start;

    return {
      success: true,
      latency,
      email,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to authenticate with Shiprocket.",
    };
  }
}

/**
 * Cancel an unassigned order in Shiprocket
 * POST /v1/external/orders/cancel
 */
export async function cancelShiprocketOrder(shiprocketOrderId: number | string): Promise<boolean> {
  try {
    const res = await shiprocketFetch<{ status_code: number; message?: string }>("/orders/cancel", {
      method: "POST",
      body: JSON.stringify({ ids: [Number(shiprocketOrderId)] }),
    });
    return res.status_code === 200;
  } catch (err) {
    console.warn("[Shiprocket] Failed to cancel order in Shiprocket:", err);
    return false;
  }
}
