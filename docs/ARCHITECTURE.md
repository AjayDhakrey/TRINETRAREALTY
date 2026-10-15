# System Architecture & Technical Specifications

## 1. Architectural Philosophy

Trinetra Realty is designed with the following core engineering principles:
1. **Decoupled Domain Layer**: Core real estate data contracts live in `shared/types/` rather than within framework-specific UI or database modules.
2. **Dual-Persistence Engine**: Transparent failover between enterprise MongoDB (via Mongoose v9) and zero-dependency local JSON file storage (`backend/data/realestate-db.json`), guaranteeing 100% platform availability across varied hosting environments.
3. **Layered Express API**: Strict separation between configuration, routing, controller orchestration, data modeling, and third-party notification services.
4. **Resilient Lead Processing**: Guaranteed lead intake with non-blocking, asynchronous dual-channel notification dispatch (SMTP email and WhatsApp).

---

## 2. High-Level Architecture Diagram

```mermaid
graph TD
    Client["React 19 SPA (Vite / Tailwind)"]
    ViteProxy["Vite Dev Proxy (:5173 /api)"]
    ExpressServer["Express 4 API Server (:3000)"]
    
    subgraph Middleware Layer
        CORS["CORS Policy Middleware"]
        AuthMiddleware["Admin Bearer Token Guard"]
    end
    
    subgraph Controller & Service Layer
        Controllers["Controllers (Property, Project, Lead, Media, Auth)"]
        NotifService["Notification Service (Nodemailer + WhatsApp)"]
    end
    
    subgraph Persistence Layer
        DBService["Database Adapter Engine"]
        MongoDB[("MongoDB / Atlas Cluster")]
        JSONStore[("Local realestate-db.json Store")]
    end
    
    subgraph External Services
        SMTP["SMTP Mail Server (Gmail / Brevo / SES)"]
        WhatsAppAPI["WhatsApp Business Gateway"]
    end

    Client -->|Development /api| ViteProxy
    ViteProxy --> ExpressServer
    Client -->|Production Direct /api| ExpressServer
    
    ExpressServer --> CORS
    CORS --> AuthMiddleware
    AuthMiddleware --> Controllers
    
    Controllers --> DBService
    Controllers -->|On New Lead| NotifService
    
    DBService -->|Primary Connection| MongoDB
    DBService -->|Fallback when DB offline| JSONStore
    
    NotifService -->|Async SMTP| SMTP
    NotifService -->|Async Webhook| WhatsAppAPI
```

---

## 3. Lead Ingestion & Notification Workflow

When a visitor requests a property valuation, submits a general enquiry, or schedules a site visit:

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Client / Visitor
    participant Frontend as React 19 Frontend
    participant LeadCtrl as leadController
    participant DB as Persistence Engine (Mongo / JSON)
    participant Notif as notificationService
    actor Owner as Business Owner (Rahul & Rohit)

    Visitor->>Frontend: Fill out inquiry / valuation form
    Frontend->>LeadCtrl: POST /api/leads with lead details
    LeadCtrl->>DB: Persist lead record (status: 'New')
    DB-->>LeadCtrl: Created lead with ID
    LeadCtrl-->>Frontend: 201 Created (Instant UX response)
    
    par Asynchronous Multi-Channel Dispatch
        LeadCtrl->>Notif: dispatchLeadNotifications(lead)
        Notif->>Notif: Render branded HTML email
        Notif->>Owner: Send SMTP notification email
    and WhatsApp Notification
        Notif->>Owner: Dispatch formatted WhatsApp alert
    end
```

---

## 4. Dual-Persistence Mechanism

The platform features an intelligent persistence layer (`backend/services/database.ts`):

1. **MongoDB Mode (Primary)**:
   - When `MONGODB_URI` is provided, Mongoose initializes a connection pool with modern settings (`family: 4` to bypass Windows IPv6 DNS latency).
   - All Mongoose models (`Property`, `Project`, `Lead`, `Locality`, `BlogPost`, `Media`, `AdminSession`, `WhatsAppSession`) operate with schema-level validation, default indexes, and virtual projections.
2. **Local JSON Mode (Fallback / Self-Contained)**:
   - If MongoDB is unreachable, the database service gracefully falls back to `backend/data/realestate-db.json`.
   - Data mutations write synchronously via atomic filesystem writes, ensuring that local development and offline environments function with zero external infrastructure.

---

## 5. Security & Authentication Model

- **Session Architecture**: Custom bearer token authentication with an 8-hour sliding window.
- **Credential Storage**: Admin credentials are read strictly from server-side environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) and are never bundled or exposed in client builds.
- **Token Invalidation**: `POST /api/admin/logout` explicitly removes the active bearer token from memory and database session stores.
- **CORS Protection**: Access is restricted based on `FRONTEND_ORIGIN` while automatically permitting local Vite development ports.

