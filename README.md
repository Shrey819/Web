# OM AUTOMATION — Industrial Automation Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-336791?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-blueviolet?style=flat-square&logo=cloudinary)](https://cloudinary.com/)
[![Shiprocket](https://img.shields.io/badge/Logistics-Shiprocket-orange?style=flat-square)](https://www.shiprocket.in/)

An enterprise-grade B2B/B2C Industrial Automation E-Commerce & Management Platform. Engineered for precision hardware parts distribution—including PLCs, Variable Frequency Drives (VFDs), Servo Systems, Industrial Sensors, and Motion Controllers—with real-time quotation generation (RFQ), faceted catalog filtering, live visitor tracking, and an extensive administration control center.

---

## 🌟 Key Features

### 🛒 Customer Storefront & Discovery
- **Mainframe Interactive Hero**: Interactive multi-angle industrial product assembly breakdown and visual component inspection.
- **Cinematic Showcase Stages**: High-impact, immersive visual stages highlighting flagship automation hardware.
- **Faceted Catalog Engine**: Multi-dimensional filtering by Category, Brand, Voltage, IP Ingress Rating, Output Type, Price Range, and In-Stock status.
- **Product Specification Matrix**: Side-by-side technical comparison tool for up to 4 automation products with diff analysis.
- **Interactive Product Detail Pages (PDP)**:
  - Multi-angle high-resolution image gallery with fullscreen zoom inspection modal.
  - Multi-dimensional variant matrix selector (voltage, communications protocol, mounting style).
  - Live inventory indicators (In Stock, Low Stock, Made to Order).
  - Detailed technical specifications tables and downloadable datasheets.
- **Request for Quote (RFQ) Engine**: Dedicated bulk order quotation form supporting custom blueprint/datasheet file uploads and project specification inputs.
- **Dynamic Slide-Over Cart**: Instant cart drawer with real-time free shipping threshold progress tracking and coupon code redemption.
- **Account & Order Management**:
  - Secure customer authentication (Argon2 credentials + Google OAuth).
  - Order history with milestone-based live delivery tracking.
  - Persistent Wishlist management.
- **Knowledge & Support Hub**: Technical resource whitepapers, knowledgebase articles, and categorized interactive FAQ.

---

### 🛠️ Admin Control Center (`/admin`)
- **Analytics Dashboard**: Real-time business KPIs (Total Revenue, Active Orders, Pending RFQs, Total Customers, Low-Stock Inventory Alerts).
- **Product Management**:
  - Full CRUD lifecycle management for complex industrial products and variants.
  - Multi-attribute variant generator (SKUs, pricing, stock levels, attributes).
  - Cloudinary media asset manager with secure signed uploads.
  - Bulk Excel/CSV catalog import and export (`.xlsx` powered by SheetJS).
- **Category Hierarchy**: Multi-level category structuring with custom banner images and icon mapping.
- **Order Fulfillment & Logistics**:
  - Order status tracking (`PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
  - Shiprocket courier integration for automated shipping labels, tracking numbers, and delivery sync.
- **RFQ / Quote Management**: Review, prioritize, price, and respond to custom industrial quotations.
- **Live Visitor Tracker**: Real-time traffic analytics, active user sessions, page-view telemetry, and visitor deduplication.
- **Dynamic Homepage CMS**: Visual builder to configure hero banners, promotional rails, category showcases, and featured collections without redeploying code.
- **Inquiry & Form Hub**: Centralized inbox for customer support requests, contact inquiries, and custom requirements.
- **Role-Based Access Control**: Granular permissions across `SUPER_ADMIN`, `ADMIN`, `CATALOG_MANAGER`, and `CUSTOMER`.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Route Handlers) |
| **UI Library** | [React 19](https://react.dev/) + [Framer Motion](https://www.framer.com/motion/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom Design Tokens |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) (Cart, Wishlist, Compare, QuickView, Toasts) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) / [Neon Serverless](https://neon.tech/) via `@neondatabase/serverless` & `pg` |
| **Auth & Security** | Argon2 Password Hashing (`argon2`), Google OAuth (`google-auth-library`), NextAuth / Custom Session Tokens |
| **Media & Storage** | [Cloudinary](https://cloudinary.com/) (`cloudinary`, `next-cloudinary`) |
| **Logistics** | [Shiprocket API](https://www.shiprocket.in/) |
| **Spreadsheets** | [SheetJS (xlsx)](https://sheetjs.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 📂 Project Structure

```text
├── app/
│   ├── (storefront)/        # Storefront routes (products, category, cart, checkout, profile, quote, etc.)
│   ├── actions/             # Server Actions (product, order, quote, category, media, shiprocket, tracker)
│   ├── admin/               # Admin dashboard & management routes (/admin/products, /admin/orders, etc.)
│   ├── api/                 # Next.js Route Handlers (auth, categories, products, tracker, webhooks)
│   ├── globals.css          # Tailwind CSS v4 design tokens and custom styles
│   └── layout.tsx           # Root layout with fonts, tracking, global modals, and drawers
├── components/
│   ├── admin/               # Admin UI components (forms, tables, dashboard widgets, CMS builder)
│   ├── catalog/             # Storefront catalog, filter sidebar, mobile drawer, active filters
│   ├── checkout/            # Checkout form and payment/shipping flows
│   ├── cinematic/           # Immersive product showcase stages
│   ├── home/                # Homepage sections (MainframeHero, ProductAssembly, BestSellers, etc.)
│   ├── layout/              # Header, Footer, AnnouncementBar, CartDrawer, UserTracker
│   ├── product/             # PDP components (ImageGallery, SpecTable, VariantSelector, QuickView)
│   └── ui/                  # Reusable UI primitives (Buttons, Modals, Inputs, Toasts, Badges)
├── data/                    # Static mock data, categories, brands, FAQs, resources
├── database/
│   ├── migrations/          # Incremental SQL migration scripts (001 to 013)
│   └── seeds/               # Initial catalog seeding scripts
├── lib/
│   ├── db.ts                # Neon Serverless PostgreSQL connection pool
│   ├── google-auth.ts       # Google OAuth verification
│   ├── homepage-server.ts   # Homepage CMS data fetching
│   ├── shiprocket.ts        # Shiprocket logistics client & tracking helpers
│   ├── session.ts           # Session and authentication helpers
│   ├── storefront.ts        # Storefront data access layer
│   └── variantGenerator.ts  # Multi-attribute variant combinatorial generator
├── scripts/                 # Utility scripts (migrate.js, seed.js, generateMockCatalog.ts)
├── store/                   # Zustand client state stores (cart, wishlist, compare, quickView, toast)
└── types/                   # TypeScript interfaces & domain models
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or later recommended
- **npm**, **pnpm**, or **yarn**
- **PostgreSQL** database (Local instance or [Neon Serverless](https://neon.tech/))
- **Cloudinary** account (for media asset management)
- *(Optional)* **Google Cloud Console** credentials (for Google OAuth)
- *(Optional)* **Shiprocket** account (for live shipping rates & tracking)

---

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/Shrey819/Web.git
cd Web
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```bash
cp .env.example .env
```

Populate the required keys:

```env
# Database (PostgreSQL / Neon)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Authentication & Sessions
AUTH_SECRET="your-super-secret-random-key"
AUTH_TRUST_HOST="true"

# Initial Super Admin Seed (Optional)
SEED_ADMIN_NAME="Super Admin"
SEED_ADMIN_EMAIL="admin@omautomation.com"
SEED_ADMIN_PASSWORD="YourSecurePassword123"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"

# Cloudinary Media Storage
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="your-upload-preset"

# Shiprocket Logistics (Optional)
SHIPROCKET_EMAIL="your-shiprocket-email@domain.com"
SHIPROCKET_PASSWORD="your-shiprocket-password"
SHIPROCKET_API_BASE="https://apiv2.shiprocket.in/v1/external"
```

---

### 4. Database Setup & Migrations

Execute the SQL schema migrations to create all required database tables, enums, indices, and constraints:

```bash
npm run db:schema
```

*(Optional)* Seed base categories and sample automation parts:

```bash
npm run db:seed
```

---

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Storefront**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Admin Login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js local development server on port 3000 |
| `npm run build` | Builds the optimized production build |
| `npm run start` | Starts the Next.js production server |
| `npm run lint` | Runs ESLint to check for code quality and syntax issues |
| `npm run db:schema` | Applies all SQL migrations from `database/migrations/` to the database |
| `npm run db:seed` | Populates the database with initial catalog and category data |
| `npm run generate:catalog` | Generates procedural mock catalog data with technical specs |

---

## 🗄️ Database Migrations

The database schema is managed via modular SQL migrations in `database/migrations/`:

| Migration | Purpose |
| :--- | :--- |
| `001_initial_schema.sql` | Core schema: Users, Sessions, Products, Categories, Orders, Quotes |
| `002_professional_product_management.sql` | Enhanced product specifications, SKU management, metadata |
| `003_multi_category_support.sql` | Multi-category relations and taxonomy hierarchies |
| `004_user_live_tracking.sql` | Real-time user session and visitor telemetry |
| `005_user_actions_and_identity.sql` | Customer activity logs and role tracking |
| `006_hybrid_location_fields.sql` | Shipping address enhancements and geolocation metadata |
| `007_admin_settings.sql` | Dynamic store configurations, shipping tiers, and tax settings |
| `008_add_phone_to_orders_and_addresses.sql` | Phone number normalization for logistics and order verification |
| `009_deduplicate_page_visit_logs.sql` | Optimized visitor analytics with deduplication indices |
| `010_google_auth_and_profile_fields.sql` | Google OAuth profile fields, avatars, and subject IDs |
| `011_google_user_additional_fields.sql` | Locale and additional identity attributes |
| `012_wix_product_system.sql` | Flexible product attributes, custom variant matrices, and options |
| `013_shiprocket_integration.sql` | Shiprocket shipment IDs, courier tracking numbers, and fulfillment status |

---

## 🚢 Deployment

### Deploying to Vercel
1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the project into the [Vercel Dashboard](https://vercel.com/new).
3. Set all environment variables defined in `.env.example`.
4. Run `npm run db:schema` against your production Neon/PostgreSQL database.
5. Deploy! Next.js will automatically build and serve the optimized application.

---

## 📄 License

This project is proprietary and confidential. All rights reserved.
