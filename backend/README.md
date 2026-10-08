# Trinetra Realty — Backend API & MongoDB Documentation

The Trinetra Realty Backend is a production-grade RESTful API service built with **Express.js**, **TypeScript**, and **Mongoose (MongoDB)**. It manages luxury property listings, flagship company developments ("Our Projects"), customer leads, algorithmic valuations, media assets, and admin operations.

---

## 🏗️ Architecture & Technology Stack

- **Runtime & Language**: Node.js (v20+ recommended) with TypeScript via `tsx`
- **Web Framework**: Express 4.x
- **Database Layer**:
  - **Primary**: **MongoDB / Mongoose 9.x** with fully typed schemas and indexed collections
  - **Hybrid Fallback**: Local atomic JSON file persistence (`backend/data/realestate-db.json`) if MongoDB URI is absent or during offline development
  - **Auto-Seeding**: Automatic collection initialization and database migration from `seedData.ts` or existing JSON storage
- **Authentication**: In-memory token-based session management with 8-hour expiration
- **CORS & Static Serving**: Configurable origin support and static media routing

---

## 📁 Directory Structure

```text
backend/
├── db/
│   ├── mongo.ts                # MongoDB connection lifecycle, status & auto-seeding
│   └── store.ts                # Unified repository store (MongoDB + fallback JSON)
├── models/
│   ├── Property.ts             # Mongoose Property Schema & Model
│   ├── Project.ts              # Mongoose CompanyProject Schema & Model
│   ├── Lead.ts                 # Mongoose CustomerLead Schema & Model
│   ├── Locality.ts             # Mongoose LocalityProfile Schema & Model
│   ├── BlogPost.ts             # Mongoose BlogPost Schema & Model
│   └── Media.ts                # Mongoose UploadedMedia Schema & Model
├── data/
│   ├── .gitkeep
│   └── realestate-db.json      # Auto-generated runtime JSON database (git-ignored)
├── server.ts                   # Core Express server, route handlers & middleware
└── README.md                   # Backend documentation (this file)
```

---

## ⚙️ Environment Configuration

Configure via standard environment variables or a `.env` file at the root:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `number` | `3000` | Port on which the API server listens. |
| `ADMIN_EMAIL` | `string` | `admin@trinetrarealty.com` | Email address required for admin login. |
| `ADMIN_PASSWORD` | `string` | `admin` | Password required for admin login. |
| `FRONTEND_ORIGIN` | `string` | _Optional_ | Allowed origin for CORS (e.g., `https://trinetrarealtyy.netlify.app` or `http://localhost:5173`). |
| `MONGODB_URI` | `string` | `mongodb://127.0.0.1:27017/trinetra_realty` | MongoDB connection URI (supports local standalone, Replica Set, or MongoDB Atlas cluster). |

---

## 🍃 MongoDB Models & Schemas

1. **Property (`PropertyModel`)**:
   - Fields: `id`, `code`, `title`, `subtitle`, `transactionType` (`Buy` \| `Rent`), `category` (`Penthouse`, `Villa`, `Townhouse`, `Waterfront`, `Estate`), `status` (`Available`, `Under Offer`, `Sold`, `Leased`), `price`, `pricePerSqFt`, `areaSqFt`, `bedrooms`, `bathrooms`, `parkingSpaces`, `locality`, `address`, `architecturalStyle`, `architect`, `yearBuilt`, `monthlyMaintenance`, `furnishedStatus`, `featured`, `images`, `description`, `amenities`, `highlights`, `createdAt`.
   - Indexed fields: `id`, `code`, `category`, `transactionType`, `status`, `price`, `locality`, `bedrooms`, `featured`.

2. **Company Project (`ProjectModel`)**:
   - Fields: `id`, `code`, `name`, `slug` (unique), `projectType`, `developerBrand`, `projectStatus` (`Upcoming`, `New Launch`, `Under Construction`, `Ready to Move`, `Completed`), `publicationState` (`DRAFT`, `PUBLISHED`, `ARCHIVED`), `featured`, `shortDescription`, `fullDescription`, `city`, `locality`, `state`, `fullAddress`, `googleMapsLink`, `coordinates`, `startingPrice`, `maxPrice`, `priceOnRequest`, `configurationSummary`, `areaRangeSqFt`, `unitsAvailable`, `totalUnits`, `possessionDate`, `reraNumber`, `projectArea`, `numberOfTowers`, `numberOfFloors`, `constructionStatus`, `coverImage`, `galleryImages`, `floorPlanImages`, `masterPlanImage`, `locationMapImage`, `brochurePdfUrl`, `projectVideoUrl`, `amenities`, `highlights`, `configurations`, `seoTitle`, `seoDescription`, `createdAt`, `updatedAt`.
   - Indexed fields: `id`, `code`, `slug`, `publicationState`, `projectStatus`, `featured`, `city`, `locality`, `reraNumber`.

3. **Customer Lead (`LeadModel`)**:
   - Fields: `id`, `type` (`Property Inquiry`, `Schedule Visit`, `Property Valuation`, `WhatsApp Contact`), `status` (`New`, `Contacted`, `Scheduled`, `Closed`), `name`, `email`, `phone`, `propertyId`, `propertyTitle`, `projectId`, `projectName`, `projectSlug`, `inquirySubType`, `leadSource`, `financingType`, `message`, `preferredDate`, `preferredTimeSlot`, `visitMode`, `valuationDetails`, `whatsappContext`, `notes`, `createdAt`.
   - Indexed fields: `id`, `email`, `phone`, `type`, `status`, `createdAt`.

4. **Locality Profile (`LocalityModel`)**:
   - Fields: `id`, `name`, `city`, `avgPricePerSqFt`, `yoyAppreciation`, `rentalYield`, `transitScore`, `architecturalCharacter`, `description`, `keyHighlights`, `heroImage`.

5. **Blog Post (`BlogPostModel`)**:
   - Fields: `id`, `title`, `subtitle`, `category`, `author`, `authorRole`, `publishedAt`, `readTime`, `image`, `excerpt`, `content`.

6. **Media Asset (`MediaModel`)**:
   - Fields: `id`, `name`, `url`, `category`, `uploadedAt`.

---

## 🚀 Running the Backend

### Start API Server
```powershell
npm run dev:api
```

### Run Fullstack (Frontend + Backend concurrently)
```powershell
npm run dev
```

### TypeScript Type Checking
```powershell
npm run typecheck:backend
```

### Run Full Backend Integration Test Suite
```powershell
npm run test:backend
```
Executes 21 automated integration tests covering the running API server, health endpoints, authentication, CRUD operations, draft isolation, valuation calculations, and session revocation.

### Run MongoDB Schema & Connection Verification
```powershell
npm run test:mongo
```
Validates all Mongoose model definitions, schema validators, document lifecycle transforms, and active MongoDB connection.

---

## 📡 REST API Reference

### 1. Health & Database Status

#### `GET /api/health`
Returns system health, active database engine (`mongodb` or `json-file`), and MongoDB readyState.

- **Response**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-07T08:52:45.000Z",
    "database": "mongodb",
    "mongo": {
      "connected": true,
      "readyState": 1,
      "host": "127.0.0.1",
      "dbName": "trinetra_realty",
      "modelsLoaded": ["Property", "Project", "Lead", "Locality", "BlogPost", "Media"]
    }
  }
  ```

#### `GET /api/db/status`
Returns direct connection status and list of registered Mongoose models.

---

### 2. System Bootstrap

#### `GET /api/bootstrap`
Returns initial platform state. Includes leads and drafts when called with valid Admin token; returns public published projects to public users.

---

### 3. Company Projects ("Our Projects")

- `GET /api/projects`: List public published projects (with `status`, `projectType`, `city`, `featured`, and `search` query filters).
- `GET /api/projects/:slugOrId`: Get single project by slug or ID (drafts return 404 for unauthenticated callers).
- `GET /api/admin/projects` [🔒 Admin]: Retrieve all company projects (drafts, published, archived).
- `POST /api/admin/projects` [🔒 Admin]: Create new company project.
- `PUT /api/admin/projects/:id` [🔒 Admin]: Update existing company project.
- `PATCH /api/admin/projects/:id/status` [🔒 Admin]: Quick status / publication state / featured toggle.
- `POST /api/admin/projects/:id/duplicate` [🔒 Admin]: Duplicate a project into a new draft.
- `DELETE /api/admin/projects/:id` [🔒 Admin]: Delete a project.

---

### 4. Property Listings

- `GET /api/properties`: List properties with filters (`transactionType`, `category`, `locality`, `minPrice`, `maxPrice`, `bedrooms`, `search`).
- `GET /api/properties/:id`: Get property by ID.
- `POST /api/properties` [🔒 Admin]: Create property listing.
- `PUT /api/properties/:id` [🔒 Admin]: Update property listing.
- `DELETE /api/properties/:id` [🔒 Admin]: Delete property listing.

---

### 5. Customer Leads & Inquiries

- `POST /api/leads`: Public lead submission (Property Inquiries, Site Visits, Valuations, WhatsApp).
- `GET /api/leads` [🔒 Admin]: Retrieve all customer leads.
- `PATCH /api/leads/:id` [🔒 Admin]: Update lead status (`New`, `Contacted`, `Scheduled`, `Closed`) and advisor notes.
- `DELETE /api/leads/:id` [🔒 Admin]: Remove lead record.

---

### 6. Algorithmic Valuation Engine

- `POST /api/valuation/calculate`: Compute instant property valuation based on locality rates and category/condition multipliers.

---

### 7. Media Management

- `GET /api/media`: List uploaded media assets.
- `POST /api/media` [🔒 Admin]: Register media asset and optionally attach to property.

---

### 8. Admin Authentication

- `POST /api/admin/login`: Issue bearer token with 8-hour expiration.
- `POST /api/admin/logout`: Revoke active session token.
