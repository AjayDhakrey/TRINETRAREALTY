# Trinetra Realty — Enterprise Real Estate Platform

A decoupled, full-stack real estate platform engineered with **React 19**, **TypeScript**, **Vite 8**, and **Tailwind CSS 4** on the frontend, alongside an **Express 4** REST API featuring an adaptive **dual-persistence engine** (MongoDB Mongoose v9 + local JSON file fallback) and multi-channel notification dispatchers.

---

## Technical Stack & Architecture

### Frontend
- **Framework**: React 19 Single Page Application (SPA)
- **Tooling & Bundler**: Vite 8 with Rolldown compiler support
- **Styling**: Tailwind CSS 4 with custom serif typography tokens and luxury color palette
- **Icons**: Lucide React + Bespoke brand SVG icons
- **State & Routing**: Client-side view orchestrator supporting Buy, Rent, Sell, Compare, EMI, Localities, Blog, and Admin portals.

### Backend
- **Runtime**: Node.js (v20+) with TypeScript (ESNext / NodeNext)
- **Framework**: Express 4 with modular routers, controllers, and middleware
- **Data Persistence**:
  - **Primary**: MongoDB Atlas / local MongoDB with Mongoose v9 ODM
  - **Zero-Dependency Fallback**: High-performance local JSON storage (`backend/data/realestate-db.json`)
- **Notifications**: Nodemailer (SMTP) and WhatsApp webhook integration
- **Authentication**: Bearer token administrative auth with sliding-window sessions

### Shared Domain
- **Contract Boundary**: Canonical TypeScript interfaces located in `shared/types/realestate.ts` ensure type safety across frontend and backend boundaries.

---

## Directory Layout

```
atelier/
├── backend/            # Express REST API, Mongoose models, controllers, services
│   ├── config/         # Environment configuration and runtime constants
│   ├── controllers/    # Decoupled request handlers and status orchestrators
│   ├── data/           # Local file database fallback & seed files
│   ├── middleware/     # Bearer authentication, CORS policies
│   ├── models/         # Mongoose schemas strictly typed against shared interfaces
│   ├── routes/         # Modular endpoint routers
│   ├── services/       # Database adapters, SMTP, WhatsApp notifications
│   └── server.ts       # Clean server bootstrap entrypoint (< 55 lines)
├── frontend/           # React 19 Client Application
│   ├── src/
│   │   ├── components/ # Reusable UI widgets and architectural displays
│   │   ├── services/   # Centralized API fetcher and demo mocks
│   │   ├── utils/      # Financial formatters, EMI calculator
│   │   ├── views/      # Individual domain views (Buy, Rent, Sell, Compare, etc.)
│   │   └── App.tsx     # View router & state orchestrator
├── shared/             # Single-source-of-truth domain interfaces
│   └── types/          # Property, Project, Lead, Locality, BlogPost models
├── scripts/            # Integration testing and database seeding utilities
│   ├── test-backend.mjs
│   └── seed-mongodb.mjs
└── docs/               # Architecture, API, database, and structure documentation
```

---

## Getting Started

### Prerequisites
- **Node.js**: v20 or v22 LTS recommended
- **npm**: v10+
- **MongoDB** (optional): Local MongoDB instance or MongoDB Atlas URI (if omitted, platform operates seamlessly via local JSON database).

### 1. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Update your credentials in `.env`:
- `ADMIN_EMAIL`: Email for administrative panel access.
- `ADMIN_PASSWORD`: Secure password for admin authentication.
- `MONGODB_URI`: (Optional) MongoDB connection string (e.g. `mongodb://127.0.0.1:27017/trinetra_realty`). If omitted or unreachable, local JSON fallback is activated automatically.
- `OWNER_NOTIFICATION_EMAIL` & `OWNER_WHATSAPP_NUMBER`: Destination coordinates for customer lead notifications.

---

## Development & Execution Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite frontend development server (`http://localhost:5173`) |
| `npm run dev:api` | Starts Express backend in live-reload mode (`http://localhost:3000`) |
| `npm run build` | Compiles production-ready frontend bundle into `frontend/dist/` |
| `npm run lint` | Typechecks frontend TypeScript code (`frontend/tsconfig.json`) |
| `npm run typecheck:backend` | Typechecks backend TypeScript code (`backend/tsconfig.json`) |
| `npm run test:backend` | Runs comprehensive 21-endpoint backend integration test suite |
| `npm run preview` | Previews production frontend build locally |

---

## Dual-Persistence Mechanism

The platform automatically determines the storage layer:
1. When `MONGODB_URI` is provided, Mongoose connects using IPv4-first DNS (`family: 4`) for maximum Atlas compatibility.
2. If MongoDB is unavailable or unconfigured, the server seamlessly switches to `backend/data/realestate-db.json`. No manual configuration is required.

To seed a MongoDB instance with starter data:
```bash
node scripts/seed-mongodb.mjs
```

---

## Verification & Testing

Run all quality and regression gates:

```bash
# 1. Typecheck Frontend
npm run lint

# 2. Typecheck Backend
npm run typecheck:backend

# 3. Backend Integration Tests (Runs all 21 endpoints against live storage)
npm run test:backend

# 4. Production Build Test
npm run build
```

---

## Documentation Suite

For comprehensive deep dives, refer to the documentation directory:
- [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md): Directory taxonomy and contribution guide.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): System architecture, data flow, and Mermaid diagrams.
- [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md): Complete specifications for all 21 REST API endpoints.
- [DATABASE_DOCUMENTATION.md](docs/DATABASE_DOCUMENTATION.md): Mongoose schemas, indexing, and dual-engine fallback rules.
