-- database/seeds/001_base_catalog.sql

INSERT INTO "Category" (id, name, slug, description, status, "sortOrder", "createdAt", "updatedAt")
VALUES 
  ('sensors', 'Sensors & Perception', 'sensors', 'High-precision inductive, photoelectric, ultrasonic, and pressure sensors engineered for harsh industrial environments.', 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('plcs', 'PLCs & Controllers', 'plcs', 'Modular programmable logic controllers, industrial IPCs, remote I/O systems, and high-speed motion CPUs.', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('drives', 'Drives & Servo Motors', 'drives', 'Variable frequency drives, brushless servo drives, high-torque industrial motors, and precision planetary gearboxes.', 'active', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO "Brand" (id, name, slug, tagline, country, status, "sortOrder", "createdAt", "updatedAt")
VALUES
  ('siemens', 'SIEMENS', 'siemens', 'Ingenuity for life industrial hardware', 'Germany', 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('schneider', 'Schneider Electric', 'schneider', 'EcoStruxure automation & power', 'France', 'active', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('abb', 'ABB', 'abb', 'Motion & robotics pioneer', 'Switzerland', 'active', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('omron', 'OMRON', 'omron', 'Sensing & control automation', 'Japan', 'active', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('allen-bradley', 'Allen-Bradley', 'allen-bradley', 'Rockwell Automation excellence', 'USA', 'active', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('delta', 'Delta Electronics', 'delta', 'Smart energy & industrial drives', 'Taiwan', 'active', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('mitsubishi', 'Mitsubishi Electric', 'mitsubishi', 'iQ Platform control solutions', 'Japan', 'active', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('honeywell', 'Honeywell', 'honeywell', 'Process sensing & control', 'USA', 'active', 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('default-brand', 'Default Brand', 'default-brand', 'Generic Automation Hardware', 'Global', 'active', 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO NOTHING;

-- Demo Admin User
INSERT INTO "User" (id, name, email, role, "createdAt", "updatedAt")
VALUES
  ('demo-admin-id', 'Demo Admin', 'admin@demo.com', 'SUPER_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;
