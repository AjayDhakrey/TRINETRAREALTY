# REST API Specification & Endpoint Reference

Base URL (Local Development): `http://localhost:3000/api`  
Base URL (Production): `https://<deployed-backend-origin>/api`

All administrative endpoints require an `Authorization: Bearer <token>` header obtained from `POST /api/admin/login`.

---

## 1. System Health & Infrastructure

### `GET /api/health`
Returns the status of the server and database connectivity.
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "database": {
    "engine": "mongodb",
    "connected": true,
    "readyState": 1
  },
  "timestamp": "2026-10-09T14:00:00.000Z"
}
```

### `GET /api/db/status`
Provides diagnostic metadata about active Mongoose models and database collections.
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "engine": "mongodb",
  "connected": true,
  "modelsLoaded": ["Property", "Project", "Lead", "Locality", "BlogPost", "Media", "AdminSession", "WhatsAppSession"]
}
```

---

## 2. Platform Bootstrap & Catalog

### `GET /api/bootstrap`
Returns the full platform initial state including properties, projects, localities, editorial blog posts, and uploaded media in a single consolidated request.
- **Auth**: None
- **Response**: `200 OK`
```json
{
  "properties": [...],
  "projects": [...],
  "localities": [...],
  "blogPosts": [...],
  "media": [...]
}
```

---

## 3. Properties

### `GET /api/properties`
Retrieves properties with optional filtering parameters.
- **Auth**: None
- **Query Parameters**:
  - `category` (optional, e.g., `Penthouse`, `Estate`, `Villa`)
  - `locality` (optional, e.g., `Sector 33`)
  - `transactionType` (optional, `Buy` or `Rent`)
  - `search` (optional keyword)
- **Response**: `200 OK` (`Property[]`)

### `GET /api/properties/:id`
Retrieves a single property by unique identifier or code.
- **Auth**: None
- **Response**: `200 OK` (`Property`) or `404 Not Found`

### `POST /api/properties`
Creates a new property listing.
- **Auth**: `Bearer <token>` (Admin)
- **Body**: Complete property payload conforming to `Property` interface.
- **Response**: `201 Created` (`Property`)

### `PUT /api/properties/:id`
Updates an existing property listing.
- **Auth**: `Bearer <token>` (Admin)
- **Body**: Partial or full `Property` payload.
- **Response**: `200 OK` (`Property`) or `404 Not Found`

### `DELETE /api/properties/:id`
Permanently deletes a property listing.
- **Auth**: `Bearer <token>` (Admin)
- **Response**: `200 OK` (`{ "success": true }`) or `404 Not Found`

---

## 4. Flagship Projects

### `GET /api/projects`
Retrieves public, published flagship development projects.
- **Auth**: None
- **Response**: `200 OK` (`CompanyProject[]`)

### `POST /api/admin/projects`
Creates a new flagship project.
- **Auth**: `Bearer <token>` (Admin)
- **Body**: Conforms to `CompanyProject` interface.
- **Response**: `201 Created` (`CompanyProject`)

### `PATCH /api/admin/projects/:id/status`
Toggles status flags (e.g., `isPublished`, `isFeatured`, or development status).
- **Auth**: `Bearer <token>` (Admin)
- **Body**: `{ "isPublished": boolean, "isFeatured"?: boolean, "status"?: string }`
- **Response**: `200 OK` (`CompanyProject`)

### `POST /api/admin/projects/:id/duplicate`
Duplicates a project development template with an updated slug and title.
- **Auth**: `Bearer <token>` (Admin)
- **Response**: `201 Created` (`CompanyProject`)

### `DELETE /api/admin/projects/:id`
Deletes a project development record.
- **Auth**: `Bearer <token>` (Admin)
- **Response**: `200 OK` (`{ "success": true }`)

---

## 5. Valuations & Customer Leads

### `POST /api/valuation/calculate`
Calculates an algorithmic property valuation based on micro-market square-foot pricing indices.
- **Auth**: None
- **Body**:
```json
{
  "locality": "Sector 33",
  "category": "Penthouse",
  "areaSqFt": 4200,
  "bedrooms": 4,
  "condition": "Museum Grade / New"
}
```
- **Response**: `200 OK`
```json
{
  "estimatedValue": 84500000,
  "estimatedRange": "₹8.05 Cr – ₹8.90 Cr",
  "adjustedPerSqFt": 20119
}
```

### `POST /api/leads`
Submits a customer enquiry, site visit request, or seller valuation mandate. Automatically triggers notification dispatch via email and WhatsApp to business owners.
- **Auth**: None
- **Body**:
```json
{
  "type": "Property Valuation",
  "name": "Amit Sharma",
  "email": "amit.sharma@example.com",
  "phone": "+919876543210",
  "message": "Interested in private appraisal.",
  "valuationDetails": { ... }
}
```
- **Response**: `201 Created` (`CustomerLead`)

### `GET /api/leads`
Fetches all received customer inquiries and valuation dossiers.
- **Auth**: `Bearer <token>` (Admin)
- **Response**: `200 OK` (`CustomerLead[]`)

### `PATCH /api/leads/:id`
Updates inquiry triage state (`New`, `Contacted`, `Qualified`, `Closed`) or appends internal notes.
- **Auth**: `Bearer <token>` (Admin)
- **Body**: `{ "status"?: string, "notes"?: string }`
- **Response**: `200 OK` (`CustomerLead`)

### `DELETE /api/leads/:id`
Permanently deletes a customer lead.
- **Auth**: `Bearer <token>` (Admin)
- **Response**: `200 OK` (`{ "success": true }`)

---

## 6. Media Asset Registry

### `GET /api/media`
Retrieves registered media asset URLs and metadata.
- **Auth**: None
- **Response**: `200 OK` (`UploadedMedia[]`)

### `POST /api/media`
Uploads or registers a media asset for use across property and project profiles.
- **Auth**: `Bearer <token>` (Admin)
- **Response**: `201 Created` (`UploadedMedia`)

---

## 7. Administrative Authentication

### `POST /api/admin/login`
Authenticates administrative users and issues an active bearer token.
- **Auth**: None
- **Body**:
```json
{
  "email": "admin@trinetrarealty.com",
  "password": "<secure-password>"
}
```
- **Response**: `200 OK`
```json
{
  "token": "admin-session-...",
  "user": {
    "email": "admin@trinetrarealty.com",
    "role": "Super Admin"
  }
}
```

### `POST /api/admin/logout`
Revokes the current bearer session.
- **Auth**: `Bearer <token>` (Admin)
- **Response**: `200 OK` (`{ "success": true }`)

