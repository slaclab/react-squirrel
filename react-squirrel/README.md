# React Squirrel

React implementation of Squirrel - Configuration Management for EPICS PVs.

This is a modern, type-safe React port of the original Qt-based Squirrel application, aligned with the [STRUDEL Workshop 2025](https://strudel.science/) technology stack.

## Technology Stack

### Core

- **React 18** with **TypeScript** for type-safe component development
- **Vite** as the build tool (fast, modern alternative to Create React App)
- **Material UI (MUI)** for the component library and design system
- **TanStack Router** for fully type-safe routing with built-in data fetching

### Development Tools

- **ESLint** + **Prettier** for code quality and formatting
- **Husky** for pre-commit hooks with lint-staged
- **TypeScript** with strict mode for enhanced type safety

## Getting Started

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
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
react-squirrel/
├── src/
│   ├── types/          # TypeScript type definitions (models, enums)
│   ├── components/     # Reusable React components
│   ├── pages/          # Page-level components
│   ├── routes/         # TanStack Router route definitions
│   ├── main.tsx        # Application entry point
│   └── routeTree.gen.ts # Auto-generated route tree (do not edit)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs       # ESLint configuration
└── .prettierrc         # Prettier configuration
```

## Features

### Implemented

- **Snapshot Details Page**: View and interact with snapshot data
  - Search and filter PVs by name, device, or description
  - Select individual or all PVs for operations
  - Restore PVs with confirmation dialog
  - Material Design UI with responsive layout
  - Severity indicators with color-coded icons

### Type System

- Full TypeScript type definitions for all data models
- Type-safe routing with TanStack Router
- Strict type checking enabled

## Development

### Pre-commit Hooks

This project uses Husky to run pre-commit hooks that:

- Lint and fix TypeScript/TSX files
- Format code with Prettier
- Ensure code quality before commits

### Router

The project uses TanStack Router for type-safe navigation. Routes are defined in `src/routes/` and automatically compiled into a route tree.

Available routes:

- `/` - Home page
- `/snapshot-details` - Snapshot details demo page

## Architecture Alignment

This implementation follows the STRUDEL Workshop 2025 best practices for scientific UI applications:

- Modern React patterns with hooks
- Type-safe throughout (TypeScript + TanStack Router)
- Professional code quality tools (ESLint, Prettier, Husky)
- Material Design for consistent, accessible UI
- Fast development experience with Vite
