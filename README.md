# 🚛 TransitOps: Enterprise Fleet Intelligence & Logistics SaaS

TransitOps is a production-grade, state-of-the-art Fleet Intelligence and Logistics Management Software-as-a-Service (SaaS) application built to optimize transport routes, track vehicle ROI, audit fuel expenses, and manage compliance.

Designed for fleet coordinators and dispatchers, TransitOps features a premium dark/light responsive interface, custom UI controls, and a serverless database backend.

---

## 🌟 Key Features

### 1. 📊 Operational Command Center (Dashboard)
* **Interactive SVG Analytics:** Live charting displaying trip counts, fuel efficiency curves, maintenance expenditure, and active dispatches.
* **Instant KPI Cards:** Real-time auditing of total mileage, fuel burn rates, net profit margins, active fleet count, and overall ROI.
* **Carbon-Themed Select Filters:** Custom-made, highly polished dropdown selectors matching the application’s palette instead of standard native browser select boxes.

### 2. 🚚 Fleet Registry & Cargo Weight Rules
* **Cargo Payload Guard:** Prevents overloading by checking cargo weight against vehicle capacity on dispatch. It displays warning panels for overweight loads.
* **Active Status Auditing:** Easily track available, on-trip, in-shop (undergoing maintenance), and retired fleet assets.
* **Detailed Financial Metrics:** Computes individual vehicle ROI based on cargo weight pricing, fuel usage receipts, and service expenses.

### 3. 👥 Compliance-First Driver Management
* **Driver Safety Statuses:** Supports active statuses (Available, On Trip, Suspended, Off Duty).
* **Automated Expiry Warning Alerts:** Automatically warns coordinators about drivers with expired heavy-vehicle licenses and blocks dispatching to suspended drivers.
* **License Auditing:** Records license classifications (LMV vs. HMV) and contact information for the fleet registry.

### 4. 🔀 Dispatch & Operations Board
* **Trip Lifecycle Manager:** Supports Draft, Dispatched, On Trip, Completed, and Cancelled statuses.
* **Smart Allocations:** Dynamically shows available vehicles and drivers when scheduling dispatches.
* **ETA & Destination Auditing:** Keeps track of route distances, final odometer logs, and fuel logs when completing trips.

### 5. 🛠️ Fuel & Maintenance Auditing
* **Fuel Receipts Logger:** Records liters filled, costs, and refueling dates to audit vehicle efficiency.
* **Maintenance Logs:** Records service details (costs, date windows, shop status).
* **Expense Associations:** Automatically links maintenance costs to completed trips to calculate true operational profits.

### 6. 🔐 Secure Role-Based Access Control (RBAC)
* **Secure Route Guard Middleware:** Leverages Next.js middleware to check session authorization tokens on every page load.
* **Granular Role Matrix:** Restricts access according to corporate roles (Fleet Managers, Dispatchers, Safety Officers, and Financial Analysts).
* **Tabbed Settings Control:** Configure the depot registry name, distance/currency units, customize alert configurations, and test webhooks dynamically.

---

## 🛠️ Architecture & Tech Stack

* **Framework:** Next.js (App Router, Turbopack compiled)
* **Language:** TypeScript
* **Database & ORM:** Serverless PostgreSQL on Neon Database, Prisma ORM
* **Styling & Assets:** TailwindCSS, Vanilla CSS, Lucide Icons
* **Hosting/Server:** Next.js Node.js server environment

---

## 🗄️ Database Entity-Relationship Model

```mermaid
erDiagram
    ROLE ||--o{ USER : "has"
    USER ||--o{ TRIP : "creates"
    VEHICLE ||--o{ TRIP : "allocated"
    DRIVER ||--o{ TRIP : "drives"
    VEHICLE ||--o{ FUEL_LOG : "receives"
    VEHICLE ||--o{ MAINTENANCE_LOG : "undergoes"
    TRIP ||--o{ EXPENSE : "records"

    ROLE {
        int id PK
        string name UNIQUE
    }

    USER {
        int id PK
        string email UNIQUE
        string password_hash
        string name
        int role_id FK
    }

    VEHICLE {
        int id PK
        string registration_number UNIQUE
        string model
        string type
        float max_capacity
        float odometer
        float acquisition_cost
        string status
        string region
    }

    DRIVER {
        int id PK
        string name
        string license_number UNIQUE
        string license_category
        datetime license_expiry
        string contact_number
        float trip_completion_rate
        string safety_compliance_status
        string active_status
    }

    TRIP {
        int id PK
        string source
        string destination
        int vehicle_id FK "nullable"
        int driver_id FK "nullable"
        float cargo_weight
        float planned_distance
        float final_odometer "nullable"
        float fuel_consumed "nullable"
        string status
        string eta "nullable"
        int created_by_id FK
    }

    FUEL_LOG {
        int id PK
        int vehicle_id FK
        float liters
        float cost
        datetime date
    }

    MAINTENANCE_LOG {
        int id PK
        int vehicle_id FK
        string description
        float cost
        datetime start_date
        datetime end_date "nullable"
        string status
    }

    EXPENSE {
        int id PK
        int trip_id FK
        float toll
        float other
        float maintenance_linked
        float total
        datetime date
    }

    SETTINGS {
        int id PK "singleton (1)"
        string depot_name
        string currency
        string distance_unit
    }
```

---

## 📂 Project Structure

```
TransitOps/
├── prisma/
│   ├── schema.prisma   # Database schema definitions
│   └── seed.ts         # High-volume mock seeding dataset
├── src/
│   ├── app/            # Next.js App Router (Pages, Clients & Layouts)
│   │   ├── analytics/  # Operational analytics curves
│   │   ├── dashboard/  # Dashboard views and filters
│   │   ├── drivers/    # Driver compliance registry
│   │   ├── expenses/   # Refueling & maintenance expenses
│   │   ├── fleet/      # Fleet registry with ROI auditing
│   │   ├── login/      # Secure credentials login page
│   │   ├── maintenance/# Fleet workshop servicing logs
│   │   ├── settings/   # Tabbed settings controls & RBAC Matrix
│   │   └── trips/      # Operations and dispatch board
│   ├── components/     # Reusable layout and custom selectors
│   ├── features/       # Backend business logic server actions
│   ├── lib/            # Prisma connection clients
│   └── middleware.ts   # Secure authentication & RBAC router guard
└── eslint.config.mjs   # Strict linter overrides
```

---

## ⚡ Getting Started & Local Setup

Follow these steps to run the application locally:

### 1. Prerequisites
Ensure you have **Node.js (v18 or higher)** and **npm** installed.

### 2. Clone the Repository
```bash
git clone https://github.com/CodesByY22/TransitOps.git
cd TransitOps
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory and specify your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://user:password@hostname/dbname?sslmode=require"
```

### 5. Run Database Migrations
Synchronize your Neon serverless database schema:
```bash
npx prisma migrate dev
```

### 6. Seed the Database
Populate the database with a high-volume logistics dataset (15 vehicles, 15 drivers, 18 trips, 10 maintenance logs, 15 fuel receipts, and 12 expenses) for direct evaluation:
```bash
npx prisma db seed
```

### 7. Run the Application
Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔑 Access Credentials (Evaluator Login)

Use these credentials to log in and test different RBAC security permissions:

| Email | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| **`manager@transitops.in`** | `mahavir123` | **Fleet Manager** | Full access to all modules, ROI tables, and settings. |
| **`raven.k@transitops.in`** | `raven123` | **Dispatcher** | Access to fleet, drivers, and dispatches. Restricted from expenses and settings. |
| **`safety@transitops.in`** | `safety123` | **Safety Officer** | Access to fleet and driver compliance details. Restricted from dispatching, settings, and expenses. |
| **`analyst@transitops.in`** | `finance123` | **Financial Analyst** | Access to expense tables and analytics. Restricted from fleet editing and settings. |

---

## 📝 Verification & Build Status

TransitOps is fully validated to be free of compile-time and run-time warnings:
* **Linting:** Passes `npm run lint` cleanly with **0 errors**.
* **Compilation:** Compiles production bundles successfully with `npm run build`.
* **Testing:** Runs with mock data in both light and dark themes.
