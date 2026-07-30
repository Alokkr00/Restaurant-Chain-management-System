# Restaurant Chain Management System (RCMS)

> Offline-first monorepo architecture for multi-outlet restaurant operations, POS billing, kitchen display workflows, and food cost analytics.

[![pnpm](https://img.shields.io/badge/package_manager-pnpm-ff69b4.svg)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/build_system-Turborepo-ef4444.svg)](https://turbo.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6.svg)](https://www.typescriptlang.org/)

---

## 🏛️ System Architecture

RCMS utilizes a **Local Edge Node + Async Cloud Sync** pattern to guarantee 100% billing and kitchen uptime even during internet outages.

```
                  ┌─────────────────────────────────────────┐
                  │          AWS Cloud API Gateway          │
                  │   (Multi-Outlet Aggregator & Menu HQ)   │
                  └────────────────────▲────────────────────┘
                                       │
                      Async Event Sync │ (WebSocket / HTTPS)
                                       │
  ┌────────────────────────────────────▼───────────────────────────────────┐
  │                           Local Edge Node                              │
  │                  (SQLite + Litestream Backup Engine)                   │
  └──────────────┬─────────────────────┬─────────────────────┬─────────────┘
                 │                     │                     │
       LAN WebSockets            LAN WebSockets          TCP Socket (9100)
                 │                     │                     │
        ┌────────┴─────────┐  ┌────────┴─────────┐  ┌────────┴─────────┐
        │  POS Waiter PWA  │  │  Kitchen Display │  │ ESC/POS Thermal │
        │  (Tablet/Phone)  │  │   System (KDS)   │  │   Print Agent   │
        └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 📁 Repository Structure

```text
├── apps/
│   ├── cloud-api/       # Cloud API gateway & multi-outlet reporting
│   ├── edge-node/       # Local outlet master server & SQLite sync engine
│   ├── kds/             # Kitchen Display System touchscreen interface
│   ├── pos-waiter/      # POS Waiter Tablet PWA & cart state manager
│   └── hq-portal/       # Executive HQ multi-outlet analytics dashboard
├── packages/
│   ├── bom-engine/      # Multi-level recipe ingredient depletion engine
│   ├── gst-engine/      # Indian GST tax calculation engine
│   ├── shared-types/    # Domain types & DTO definitions
│   └── sync-protocol/   # Event envelope & sync protocol definitions
└── services/
    └── print-agent/     # Native ESC/POS thermal printer TCP socket agent
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Clone repository
git clone https://github.com/Alokkr00/Restaurant-Chain-management-System.git
cd Restaurant-Chain-management-System

# Install workspace dependencies
pnpm install
```

### Development Scripts

```bash
# Run build across all apps & packages via Turborepo
pnpm build

# Start local edge node server
pnpm --filter @rcms/edge-node dev

# Start Cloud API Gateway
pnpm --filter @rcms/cloud-api dev
```

---

## ⚙️ Core Engines

### 1. Indian GST Engine (`@rcms/gst-engine`)
Calculates CGST (2.5%) + SGST (2.5%) or IGST (5%) with exact paisa rounding guarantees:

```typescript
import { calculateGST } from '@rcms/gst-engine';

const tax = calculateGST(700);
// Returns: { cgstRate: 2.5, cgstAmount: 17.5, sgstRate: 2.5, sgstAmount: 17.5, totalTax: 35 }
```

### 2. Recipe BOM Depletion Engine (`@rcms/bom-engine`)
Depletes raw stock inventory based on yield percentage and wastage allowance:

$$\text{Gross Depleted Qty} = \left(\frac{\text{Net Qty}}{\text{Yield \%}}\right) \times (1 + \text{Wastage \%}) \times \text{Servings}$$

---

## 📄 License

MIT License. Developed by [Alok Kumar](https://github.com/Alokkr00).
