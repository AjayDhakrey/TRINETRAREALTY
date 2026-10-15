# Project Structure & Directory Taxonomy

## 1. High-Level Architecture Overview

Trinetra Realty is structured as an enterprise-grade, decoupled full-stack TypeScript monolith containing:
- **`frontend/`**: Modern React 19 SPA powered by Vite 8 and Tailwind CSS 4.
- **`backend/`**: Modular Node.js / Express 4 API server with dual-engine persistence (MongoDB Mongoose v9 + local JSON file fallback) and multi-channel notifications (SMTP & WhatsApp).
- **`shared/`**: Canonical TypeScript contracts, models, schemas, and shared domain types.
- **`scripts/`**: DevOps, testing, database seeding, and build automation.
- **`docs/`**: Architecture diagrams, API specifications, and database documentation.

```
atelier/
├── backend/                  # Express REST API, Mongoose models, controllers, services
│   ├── config/               # Environment resolution, constants, DNS setup
│   ├── controllers/          # Request handling & HTTP status orchestrators
│   ├── data/                 # Local filesystem database fallback & sample JSON seeds
│   ├── middleware/           # Bearer authentication, CORS policy, error handling
│   ├── models/               # Mongoose schemas with strict TypeScript typing
│   ├── routes/               # Modular Express routers & route definitions
│   ├── services/             # Notification (SMTP/WhatsApp), DB engine, SMS dispatch
│   ├── server.ts             # Clean bootstrap server entrypoint (< 55 lines)
│   └── tsconfig.json         # Strict Node/ESNext TypeScript configuration
├── frontend/                 # React 19 Single Page Application
│   ├── src/
│   │   ├── components/       # Presentational and composite architectural widgets
│   │   ├── services/         # API HTTP client with transparent error handling
│   │   ├── types/            # Frontend re-exports from canonical domain layer
│   │   ├── utils/            # Formatters, calculations (EMI amortization, INR formatting)
│   │   ├── views/            # Domain views (Buy, Rent, Sell, Compare, EMI, Localities, etc.)
│   │   ├── App.tsx           # Route state orchestrator and top-level layout
│   │   └── main.tsx          # React DOM entrypoint
│   ├── index.html            # HTML5 shell with responsive viewports & typography
│   ├── tailwind.config.js    # Design tokens, serif typography, bespoke color palette
│   ├── tsconfig.json         # Strict DOM/React JSX TypeScript configuration
│   └── vite.config.ts        # Vite 8 dev server, reverse proxy, and bundling rules
├── shared/                   # Decoupled Domain Boundary
│   └── types/
│       └── realestate.ts     # Canonical interfaces (Property, Project, Lead, Locality, etc.)
├── scripts/                  # Automation & DevOps
│   ├── test-backend.mjs      # Comprehensive 21-endpoint integration test suite
│   └── seed-mongodb.mjs      # Database provisioning and sample dataset ingestion
├── docs/                     # Architectural Documentation Suite
│   ├── ARCHITECTURE.md       # High-level architecture, data flows & Mermaid diagrams
│   ├── API_DOCUMENTATION.md  # Complete 21-endpoint REST API contract & specs
│   ├── DATABASE_DOCUMENTATION.md # Mongoose schemas, indexes, and fallback mechanics
│   └── PROJECT_STRUCTURE.md  # Detailed folder tree and module guidelines (this file)
├── .env.example              # Sanitized environment variable configuration template
├── package.json              # Monorepo scripts, build targets, and dependencies
└── README.md                 # Primary developer and operator onboarding manual
```

---

## 2. Directory Taxonomy & Responsibilities

### `backend/`
The backend handles business logic, database transactions, administrative authentication, and notification dispatching.

| Path | Responsibility |
| :--- | :--- |
| `backend/config/index.ts` | Loads environment variables (`.env`), configures IPv4 DNS resolution for MongoDB Atlas / SMTP providers, and exposes typed immutable runtime constants. |
| `backend/middleware/auth.ts` | Validates `Bearer` tokens for protected administrative operations, manages session lifetimes (8-hour sliding window), and revokes tokens upon logout. |
| `backend/middleware/cors.ts` | Configures dynamic CORS whitelisting supporting local Vite development (`localhost:5173`) and production Netlify origins. |
| `backend/models/*.ts` | Mongoose 9 ODM models (`Property`, `Project`, `Lead`, `Locality`, `BlogPost`, `Media`, `AdminSession`, `WhatsAppSession`) strictly typed against `shared/types/realestate.ts`. |
| `backend/controllers/*.ts` | Decoupled controller layer isolating HTTP requests and responses from underlying database queries (`propertyController`, `leadController`, `projectController`, etc.). |
| `backend/routes/*.ts` | Router modules mapping URI routes and HTTP verbs to controller methods, aggregated via `backend/routes/index.ts`. |
| `backend/services/database.ts` | Manages connection state to MongoDB with automatic, non-blocking fallback to `backend/data/realestate-db.json` when MongoDB is unavailable. |
| `backend/services/notificationService.ts` | Dispatches dual-channel notifications (automated HTML email via Nodemailer + WhatsApp webhook) upon new customer lead submissions. |
| `backend/services/whatsappService.ts` | Integrates official WhatsApp Business API / webhook payload dispatchers. |
| `backend/server.ts` | Minimal server bootstrap initializing Express middleware, route mounting, database connectivity, and port binding. |

### `frontend/`
The frontend is a bespoke luxury real estate client application built with React 19 and Tailwind CSS 4.

| Path | Responsibility |
| :--- | :--- |
| `frontend/src/views/` | Modularized primary application views: `BuyView`, `RentView`, `SellView`, `ComparisonView`, `EmiCalculatorView`, `LocalitiesView`, `BlogView`, `ContactView`. |
| `frontend/src/components/` | Reusable UI building blocks: `PropertyCard`, `CompanyProjectCard`, `CustomerLeadsModal`, `ArchitecturalImage`, `FloatingSocialDock`, `AdminPanelView`. |
| `frontend/src/components/ToolsAndPortals.tsx` | Clean backward-compatible barrel export facilitating seamless imports for existing consumer code. |
| `frontend/src/services/api.ts` | Centralized `apiFetch` wrapper providing transparent JSON parsing, base URL routing, and error formatting. |
| `frontend/src/services/demoApi.ts` & `demoAuth.ts` | In-browser client simulation mode allowing UI demonstration on static platforms without a live API. |
| `frontend/src/utils/formatters.ts` | Financial calculations (Indian numbering format, Crores/Lakhs abbreviations, EMI amortization schedule generator). |
| `frontend/src/types/realestate.ts` | Compatibility layer re-exporting canonical domain types from `shared/types/realestate.ts`. |

### `shared/`
Provides single-source-of-truth TypeScript definitions.
- **`shared/types/realestate.ts`**: Contains domain definitions including `Property`, `CompanyProject`, `CustomerLead`, `LocalityProfile`, `BlogPost`, `UploadedMedia`, `LeadType`, and `PropertyCategory`. Both the backend models and frontend components reference this layer, preventing type drift.

---

## 3. Developer Extension Guidelines

### Where to Add New Features

| Feature / Artifact | Recommended Placement | Integration Steps |
| :--- | :--- | :--- |
| **New API Endpoint** | `backend/controllers/<name>Controller.ts` & `backend/routes/<name>Routes.ts` | 1. Implement handler in controller.<br>2. Register route in router.<br>3. Mount router in `backend/routes/index.ts`.<br>4. Add regression test in `scripts/test-backend.mjs`. |
| **New Database Collection** | `backend/models/<Name>.ts` | 1. Define schema interface in `shared/types/realestate.ts`.<br>2. Build schema and model in `backend/models/`.<br>3. Export model from `backend/models/index.ts`.<br>4. Add fallback handling in `database.ts` if local file mode is active. |
| **New Frontend View / Page** | `frontend/src/views/<Name>View.tsx` | 1. Create component in `frontend/src/views/`.<br>2. Export from `frontend/src/views/index.ts`.<br>3. Add route handler in `frontend/src/App.tsx`. |
| **New Reusable Component** | `frontend/src/components/<ComponentName>.tsx` | 1. Build stateless or controlled component in `frontend/src/components/`.<br>2. Document props interface cleanly. |
| **New Shared Domain Type** | `shared/types/realestate.ts` | 1. Add type/interface to `shared/types/realestate.ts`.<br>2. Re-export in `frontend/src/types/realestate.ts`.<br>3. Run `npm run typecheck:backend` and `npm run lint`. |

