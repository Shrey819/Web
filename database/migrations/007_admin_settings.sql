-- database/migrations/007_admin_settings.sql

CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "key" TEXT PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "SystemSetting" ("key", "value") VALUES
('store_name', 'OM Automation & Industrial Controls'),
('support_email', 'support@omautomation.com'),
('support_phone', '+91 9876543210'),
('currency_symbol', '₹'),
('gst_number', '27AAAAA0000A1Z5'),
('min_order_value', '1000'),
('tax_rate', '18'),
('cod_enabled', 'true'),
('maintenance_mode', 'false')
ON CONFLICT ("key") DO NOTHING;
