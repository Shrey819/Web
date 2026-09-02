-- Migration 013: Shiprocket Logistics Integration
-- Adds Shiprocket metadata columns to Shipment and sets default settings

ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "shiprocketOrderId" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "shiprocketShipmentId" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "awbCode" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "courierCompanyId" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "courierName" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "labelUrl" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "invoiceUrl" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "manifestUrl" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickupScheduledDate" TIMESTAMP(3);
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "pickupTokenNumber" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "etd" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "currentStatus" TEXT;
ALTER TABLE "Shipment" ADD COLUMN IF NOT EXISTS "trackingData" JSONB;

-- Seed default Shiprocket settings if not present
INSERT INTO "SystemSetting" ("key", "value") VALUES
('shiprocket_enabled', 'true'),
('shiprocket_email', ''),
('shiprocket_password', ''),
('shiprocket_pickup_location', 'Primary'),
('shiprocket_pickup_pincode', '360004'),
('shiprocket_default_weight', '0.5'),
('shiprocket_default_length', '10'),
('shiprocket_default_breadth', '10'),
('shiprocket_default_height', '10'),
('shiprocket_auto_sync', 'false')
ON CONFLICT ("key") DO NOTHING;
