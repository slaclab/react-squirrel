# Squirrel Application Architecture

## Overview
Squirrel is a desktop GUI application for Configuration Management of EPICS Process Variables (PVs). It allows users to create snapshots of control system states, compare configurations, and apply saved settings.

## High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "User Interface Layer (PySide6/Qt)"
        UI[Main Window<br/>widgets/window.py]
        NAV[Navigation Panel]

        subgraph "Pages"
            P1[Snapshot List Page]
            P2[Snapshot Details Page]
            P3[Comparison Page]
            P4[PV Browser Page]
            P5[Configure Tags Page]
        end

        subgraph "UI Components"
            TABLES[Table Models & Views]
            WIDGETS[Custom Widgets<br/>TagsWidget, DateRange, etc.]
            DIALOGS[Dialogs & Popups<br/>PV Details, Filters, etc.]
        end
    end

    subgraph "Application Logic Layer"
        CLIENT[Client API<br/>client.py<br/>- snap()<br/>- apply()<br/>- search()<br/>- save()/delete()]

        PERM[Permission Manager<br/>Admin Authentication]
        DIFF[Diff Dispatcher<br/>Snapshot Comparisons]
    end

    subgraph "Data Model Layer"
        MODEL[Core Data Models<br/>model.py]

        subgraph "Data Classes"
            EPICS[EpicsData<br/>value, status, severity]
            PV[PV<br/>setpoint, readback, config]
            SNAP[Snapshot<br/>collection of PVs]
        end
    end

    subgraph "Data Access Layer"
        subgraph "Backend (Persistence)"
            BE[Abstract Backend<br/>backends/core.py]
            BE1[FileStore Backend<br/>JSON files]
            BE2[MongoDB Backend]
            BE3[Directory Backend]
            BE4[Test Backend<br/>in-memory]
        end

        subgraph "Control Layer (Hardware Comm)"
            CL[Control Layer<br/>control_layer/core.py]
            SHIM[Aioca Shim<br/>EPICS Channel Access]
            TASK[Task Status<br/>async tracking]
        end
    end

    subgraph "External Systems"
        FS[(File Storage<br/>JSON)]
        DB[(MongoDB<br/>Database)]
        EPICS_SYS[EPICS Control System<br/>PV Network]
    end

    UI --> NAV
    NAV --> P1 & P2 & P3 & P4 & P5
    P1 & P2 & P3 & P4 & P5 --> TABLES
    P1 & P2 & P3 & P4 & P5 --> WIDGETS
    P1 & P2 & P3 & P4 & P5 --> DIALOGS

    TABLES --> CLIENT
    WIDGETS --> CLIENT
    DIALOGS --> CLIENT

    UI --> PERM
    UI --> DIFF

    CLIENT --> MODEL
    CLIENT --> BE
    CLIENT --> CL

    MODEL --> EPICS & PV & SNAP

    BE --> BE1 & BE2 & BE3 & BE4
    BE1 --> FS
    BE2 --> DB

    CL --> SHIM
    SHIM --> EPICS_SYS
    CL --> TASK

    classDef uiLayer fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef logicLayer fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef dataLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef accessLayer fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef external fill:#ffebee,stroke:#b71c1c,stroke-width:2px

    class UI,NAV,P1,P2,P3,P4,P5,TABLES,WIDGETS,DIALOGS uiLayer
    class CLIENT,PERM,DIFF logicLayer
    class MODEL,EPICS,PV,SNAP dataLayer
    class BE,BE1,BE2,BE3,BE4,CL,SHIM,TASK accessLayer
    class FS,DB,EPICS_SYS external
```

## Component Details

### 1. User Interface Layer (PySide6/Qt)

**Main Window** (`widgets/window.py`)
- Entry point for the GUI
- Stacked page navigation system
- Singleton pattern implementation

**Pages** (`pages/`)
- `PVBrowserPage` - Browse and manage PVs
- `SnapshotDetailsPage` - View snapshot contents
- `SnapshotComparisonPage` - Compare two snapshots
- `TagPage` - Configure tag groups

**Components**
- Custom table models with filtering/sorting
- Tag widgets, date ranges, filter bars
- PV detail popups and dialogs

### 2. Application Logic Layer

**Client API** (`client.py`)
- Main programmatic interface
- Configuration file parsing (INI format)
- Core operations:
  - `snap()` - Capture current PV states
  - `apply()` - Push setpoints to hardware
  - `search()` - Query snapshots and PVs
  - `save()`/`delete()` - Persist changes

**Permission Manager** (`permission_manager.py`)
- Admin authentication singleton
- Controls access to sensitive operations
- Signal-based permission updates

**Diff Dispatcher** (`widgets/diff_dispatcher.py`)
- Coordinates snapshot comparisons
- Signal-based diff notifications

### 3. Data Model Layer

**Core Models** (`model.py`)

Three primary dataclasses:

1. **EpicsData**
   - Unified EPICS value container
   - Fields: data, status, severity, timestamp
   - Metadata: units, precision, alarm limits

2. **PV (Process Variable)**
   - Single control point definition
   - Setpoint, readback, config addresses
   - Associated data and metadata
   - Tags and tolerances

3. **Snapshot**
   - Captured system state
   - Collection of PVs with values
   - Metadata: title, description, creation_time

### 4. Data Access Layer

**Backend System** (`backends/`)

Abstract interface with multiple implementations:
- **FileStore** - JSON file storage
- **MongoDB** - Database backend
- **Directory** - Directory-based storage
- **Test** - In-memory for testing

Common operations:
- `search()` - Query with flexible operators (eq, lt, gt, like, isclose)
- `save_entry()`/`delete_entry()`/`update_entry()`
- Tag and meta-PV management

**Control Layer** (`control_layer/`)

Hardware communication layer:
- Protocol-agnostic dispatcher
- Pluggable "shims" for different protocols
- **Aioca shim** - EPICS Channel Access implementation
- Async operations with TaskStatus tracking

Operations:
- `get(address)` - Read PV value(s) → EpicsData
- `put(address, value)` - Write value(s) to PV(s)
- `subscribe()` - Monitor PV changes

### 5. External Systems

**Storage**
- JSON files (FileStore backend)
- MongoDB database (Mongo backend)

**Control System**
- EPICS network (Channel Access protocol)
- Distributed PV infrastructure

## Data Flow Examples

### Snapshot Capture Flow
```
User clicks "Save Snapshot"
    ↓
Metadata Dialog (title, description, tags)
    ↓
Client.snap()
    ├→ Get all PVs from backend
    ├→ ControlLayer.get() for all PV addresses (async)
    ├→ Create Snapshot with EpicsData values
    └→ Backend.save_entry(snapshot)
    ↓
UI refreshes to show new snapshot
```

### Snapshot Apply Flow
```
User selects snapshot → "Apply"
    ↓
SnapshotDetailsPage displays values
    ↓
Client.apply(snapshot)
    ├→ Filter PVs with setpoint values
    ├→ ControlLayer.put() for all setpoints (async)
    └→ Return TaskStatus list
    ↓
Hardware updated with saved values
```

### Search Flow
```
UI filter/search input
    ↓
Client.search(SearchTerm1, SearchTerm2, ...)
    ↓
Backend.search() applies operators
    ↓
Generator yields matching entries
    ↓
TableModel updates display
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| GUI Framework | PySide6 (Qt 6) via QtPy abstraction |
| Language | Python 3.10+ (requires ≤3.13) |
| EPICS Interface | aioca (async Channel Access) |
| Data Serialization | apischema |
| Storage | FileStore (JSON), MongoDB |
| Icons | Qt Awesome |
| Testing | pytest, pytest-qt, caproto (IOC simulator) |

## Architecture Patterns

1. **Three-Tier Architecture**
   - Presentation (UI)
   - Business Logic (Client API)
   - Data Access (Backend + Control Layer)

2. **Model-View Pattern**
   - Qt's QAbstractTableModel + QSortFilterProxyModel
   - Separation of data from presentation

3. **Signal-Slot Architecture**
   - PyQt/PySide signals for loose coupling
   - Event-driven communication

4. **Singleton Pattern**
   - Window, PermissionManager, DiffDispatcher
   - QtSingleton metaclass

5. **Pluggable Backends**
   - Abstract interface with multiple implementations
   - Configuration-driven selection

6. **Async/Await**
   - asyncio for concurrent hardware operations
   - TaskStatus wrapper for progress tracking

## Configuration

**Config File Format (INI)**
```ini
[backend]
type = filestore
path = ./db/filestore.json

[control_layer]
ca = true
pva = false

[meta PVs]
pvs = PV:Address1
      PV:Address2
```

**Search Paths:**
1. `$SQUIRREL_CFG` environment variable
2. `$XDG_CONFIG_HOME/squirrel.cfg`
3. `~/.config/squirrel.cfg`
4. Default demo config

## Entry Points

**CLI**: `squirrel/bin/main.py`
```bash
squirrel ui [--log] [--admin]    # Launch GUI
squirrel demo                     # Demo mode
```

**Programmatic**: Import `squirrel.Client` for API access

## Key Files

| Purpose | Files |
|---------|-------|
| Entry Point | `squirrel/bin/main.py` |
| Client API | `squirrel/client.py` |
| Data Models | `squirrel/model.py` |
| Main Window | `squirrel/widgets/window.py` |
| Pages | `squirrel/pages/*.py` |
| Tables | `squirrel/tables/*.py` |
| Backends | `squirrel/backends/*.py` |
| Control Layer | `squirrel/control_layer/core.py` |
| Permissions | `squirrel/permission_manager.py` |
