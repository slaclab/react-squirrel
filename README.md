# React Squirrel

Modern web-based frontend for Configuration Management of EPICS Process Variables (PVs).

React Squirrel provides a responsive, high-performance interface for creating snapshots of control system states, comparing configurations, and managing PV settings. It communicates with a backend API (score-backend) that handles persistence and EPICS control system integration.

## Features

- **Snapshot Management** - Create, view, and delete snapshots of PV values
- **Live PV Values** - Real-time display of current PV values alongside saved values
- **Snapshot Comparison** - Side-by-side comparison of two snapshots with difference highlighting
- **PV Browser** - Browse, search, add, and import PVs with CSV support
- **Tag Management** - Organize PVs with tag groups for filtering
- **Virtual Scrolling** - Handle 10,000+ PVs with smooth performance
- **Restore Functionality** - Preview and restore saved setpoint values

## Technology Stack

| Category     | Technology                     |
| ------------ | ------------------------------ |
| Framework    | React 18 + TypeScript          |
| Build Tool   | Vite                           |
| UI Library   | Material UI (MUI)              |
| Routing      | TanStack Router                |
| Server State | TanStack React Query           |
| Tables       | TanStack React Table + Virtual |
| Real-time    | REST polling / Socket.io       |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:8080`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Code Quality

```bash
npm run lint         # Run linter
npm run lint:fix     # Fix linting issues
npm run format       # Format code
npm run format:check # Check formatting
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── VirtualTable/   # High-performance virtualized table
│   ├── Layout.tsx      # Main layout (sidebar + content)
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── SearchBar.tsx   # Search input
│   ├── PVTable.tsx     # PV table with live values
│   └── ...
│
├── contexts/            # React Context providers
│   ├── LivePVContext   # Live PV value polling
│   ├── SnapshotContext # Snapshot creation progress
│   └── HeartbeatContext # Server health monitoring
│
├── services/            # API service layer
│   ├── apiClient.ts    # Base HTTP client
│   ├── snapshotService # Snapshot CRUD
│   ├── pvService       # PV operations
│   └── tagsService     # Tag management
│
├── hooks/               # Custom React hooks
│   ├── useLiveValues   # Subscribe to live PV updates
│   └── queries/        # TanStack Query hooks
│
├── pages/               # Page-level components
│   ├── SnapshotListPage
│   ├── SnapshotDetailsPage
│   ├── SnapshotComparisonPage
│   ├── PVBrowserPage
│   ├── PVDetailsPage
│   └── TagPage
│
├── routes/              # TanStack Router definitions
│   ├── __root.tsx      # Root layout + providers
│   ├── snapshots.tsx
│   ├── snapshot-details.tsx
│   ├── comparison.tsx
│   ├── pv-browser.tsx
│   └── tags.tsx
│
├── types/               # TypeScript definitions
│   ├── models.ts       # Core domain models
│   └── api.ts          # Backend DTO interfaces
│
├── config/              # Configuration
├── utils/               # Utility functions
└── main.tsx             # Application entry point
```

## Routes

| Route                         | Description                    |
| ----------------------------- | ------------------------------ |
| `/`                           | Redirects to `/snapshots`      |
| `/snapshots`                  | Browse and search snapshots    |
| `/snapshot-details?id=`       | View snapshot with live values |
| `/comparison?mainId=&compId=` | Compare two snapshots          |
| `/pv-browser`                 | Browse, add, and manage PVs    |
| `/pv-details?id=`             | View individual PV information |
| `/tags`                       | Manage tag groups              |

## Key Features

### Snapshot Details Page

- View saved PV values with severity indicators
- Real-time live value updates
- Filter PVs by tags, search by name/device
- Select PVs for restore operation
- Compare with another snapshot

### Snapshot Comparison

- Virtualized table for performance
- Color-coded difference highlighting
- Compare setpoint and readback values
- Select PVs for batch operations

### PV Details

- Detailed view of individual PV information
- Display device, description, and PV addresses
- Show current setpoint, readback, and config values
- View assigned tags and metadata
- Admin-only edit functionality

### PV Browser

- Search PVs with wildcards
- Add individual PVs or bulk import via CSV
- View live values
- Manage PV tags

### Restore Dialog

- Preview PVs and values to be restored
- Scrollable table with PV names and saved setpoints
- Confirm before applying values

## Development

### Pre-commit Hooks

This project uses Husky to run pre-commit hooks that:

- Lint and fix TypeScript/TSX files
- Format code with Prettier
- Ensure code quality before commits

### Backend Proxy

Vite proxies `/v1/*` requests to `http://localhost:8080` during development. Configure in `vite.config.ts`.

### Environment

The frontend expects the backend API to be running. See the backend repository for setup instructions.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation on:

- Application architecture and data flow
- State management patterns
- Component structure
- API layer design
- Performance optimizations

## License

[Add license information]
