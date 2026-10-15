# Database Documentation & Schema Specifications

## 1. Persistence Model Overview

Trinetra Realty uses an adaptive, dual-engine data tier:
1. **MongoDB / MongoDB Atlas (Primary Engine)**: Managed via Mongoose v9 with schema enforcement, typed documents, indexing, and strict validation.
2. **Local JSON Database (Fallback Engine)**: Handled via `backend/data/realestate-db.json` when no MongoDB instance is reachable, allowing development and testing without installing database software.

---

## 2. Collections & Mongoose Schemas

All schemas mirror the canonical types in `shared/types/realestate.ts`.

### 1. `Property` (`properties` collection)
Represents ultra-luxury and prime residential asset listings.
- **Fields**:
  - `id`: `String` (Unique primary key identifier, e.g. `prop-101`) - Indexed.
  - `code`: `String` (Short human-readable reference code, e.g. `TR-701`).
  - `title`: `String` (Listing headline).
  - `price`: `Number` (Price in INR).
  - `transactionType`: `String` (`'Buy'` | `'Rent'`).
  - `category`: `String` (`'Penthouse'` | `'Estate'` | `'Waterfront'` | `'Villa'` | `'Townhouse'`).
  - `locality`: `String` (Micro-market name).
  - `areaSqFt`: `Number` (Interior square footage).
  - `bedrooms`: `Number`.
  - `bathrooms`: `Number`.
  - `images`: `[String]` (Ordered media array).
  - `featured`: `Boolean` (Flags priority carousel display).
  - `status`: `String` (`'Available'` | `'Under Mandate'` | `'Sold'`).

### 2. `Project` (`projects` collection)
Flagship residential and commercial developments.
- **Fields**:
  - `id`: `String` (Unique identifier, e.g. `proj-aurelia`).
  - `slug`: `String` (URL slug) - Indexed.
  - `title`: `String` (Project title).
  - `subtitle`: `String`.
  - `tagline`: `String`.
  - `status`: `String` (`'Active Sales'` | `'Under Construction'` | `'Delivered'`).
  - `isPublished`: `Boolean` - Indexed.
  - `isFeatured`: `Boolean` - Indexed.
  - `units`: `[Subdocument]` (Floorplans and unit variants).
  - `specifications`: `Map of String` (Architectural features and materials).

### 3. `Lead` (`leads` collection)
Customer inquiries, site visit bookings, and valuation mandates.
- **Fields**:
  - `id`: `String` (Unique identifier, e.g. `lead-179155...`).
  - `type`: `String` (`'Property Inquiry'` | `'Schedule Visit'` | `'Property Valuation'` | `'WhatsApp Contact'`).
  - `name`: `String` (Customer name).
  - `email`: `String` (Customer email).
  - `phone`: `String` (Contact telephone / WhatsApp).
  - `propertyId`: `String` (Optional associated property reference).
  - `message`: `String` (Inquiry notes).
  - `status`: `String` (`'New'` | `'Contacted'` | `'Qualified'` | `'Closed'`).
  - `valuationDetails`: `Object` (Stored parameters and price range if submitted via valuation portal).
  - `createdAt`: `Date` (Auto-generated timestamp) - Indexed.

### 4. `Locality` (`localities` collection)
Micro-market intelligence, historical appreciation rates, and zoning metrics.
- **Fields**:
  - `id`: `String` (e.g. `loc-tribeca`).
  - `name`: `String` (e.g. `Sector 33, Sonipat`).
  - `avgPricePerSqFt`: `Number`.
  - `yoyAppreciation`: `Number`.
  - `rentalYield`: `Number`.
  - `transitScore`: `Number`.
  - `keyHighlights`: `[String]`.

### 5. `BlogPost` (`blogposts` collection)
Editorial monographs and quarterly market research monographs.
- **Fields**:
  - `id`: `String`.
  - `title`: `String`.
  - `subtitle`: `String`.
  - `slug`: `String`.
  - `author`: `String`.
  - `content`: `[String]`.
  - `category`: `String`.
  - `publishedAt`: `String`.

### 6. `Media` (`media` collection)
Uploaded architectural photography, floorplan diagrams, and brochure PDFs.
- **Fields**:
  - `id`: `String`.
  - `name`: `String`.
  - `url`: `String`.
  - `size`: `Number`.
  - `mimeType`: `String`.
  - `uploadedAt`: `Date`.

### 7. `AdminSession` (`adminsessions` collection)
Active administrative bearer tokens.
- **Fields**:
  - `token`: `String` (Indexed).
  - `email`: `String`.
  - `role`: `String`.
  - `createdAt`: `Date` (Expires automatically after 8 hours via TTL index).

---

## 3. Database Seeding & Migrations

To populate an initial MongoDB instance with sample properties, projects, localities, and monographs without affecting existing data:

```bash
# Seed or synchronize MongoDB instance
node scripts/seed-mongodb.mjs
```

The script:
1. Validates connection to `MONGODB_URI`.
2. Inspects existing collections; if collections are populated, it performs a safe upsert without dropping or destroying production records.
3. Automatically creates indexes on `id`, `slug`, and `createdAt`.

