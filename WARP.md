# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is the **Mojaloop Testing Toolkit UI** - a React-based web application for testing Mojaloop implementations. It's part of the Mojaloop ecosystem and provides a comprehensive testing interface for financial transaction processing.

## Development Commands

### Core Development
- `npm start` - Start development server with Vite (runs on port 3000, proxies API to localhost:4040)
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally

### Testing
- `npm test` - Run all tests with Vitest
- `npm run test:unit` - Run unit tests only (`test/unit` directory)
- `npm run test:int` or `npm run test:integration` - Run integration tests (`test/integration` directory)
- `npm run test:functional` - Run functional tests (installs additional dependencies first)
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with Vitest UI interface
- `npm run test:xunit` - Generate JUnit XML test reports

### Code Quality
- `npm run lint` - Run ESLint on source code
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run lint:ci` - Lint with zero warnings tolerance (for CI)
- `npm run lint:errors-only` - Show and fix only errors
- `npm run lint:dir <directory>` - Lint specific directory

### Security & Dependencies  
- `npm run audit:check` - Check for security vulnerabilities
- `npm run audit:fix` - Fix security issues automatically
- `npm run dep:check` - Check for outdated dependencies
- `npm run dep:update` - Update dependencies

### Electron Desktop App
- `npm run electron` - Run as Electron desktop app
- `npm run electron:dev` - Run Electron in development mode
- `npm run electron:build` - Build Electron app after web build

### Release Management
- `npm run release` - Create new release with standard-version
- `npm run snapshot` - Create snapshot release

## Architecture Overview

### Application Structure
- **React 19** with Ant Design v5 UI components
- **Vite** build system with TypeScript support
- **React Router** for client-side routing
- **MobX** for state management (implied by dependencies)
- **Socket.IO** for real-time communication with backend

### Key Application Areas

1. **Admin Layout** (`/admin/*`) - Main application interface with:
   - Dashboard and monitoring
   - Rules management (Response, Validation, Callback)
   - Test runner for outbound requests
   - Reports and API management
   - Settings and configuration

2. **Simulator Components** - Various mobile and payment simulators:
   - Mobile Simulator
   - Payee/Payer App Simulators
   - PISP (Payment Initiation Service Provider) Demo

3. **Demo & Testing Tools**:
   - Demo test runner
   - Demo monitoring
   - Various financial transaction simulators

### Source Code Organization
- `src/main.jsx` - Application entry point with routing configuration
- `src/routes.jsx` - Route definitions with icons and components
- `src/views/` - Feature-based view components organized by functionality
- `src/services/` - API and business logic services
- `src/components/` - Reusable UI components
- `src/utils/` - Utility functions and helpers

### Key Dependencies
- **@mojaloop/ml-testing-toolkit-shared-lib** - Shared Mojaloop testing utilities
- **ace-builds** & **react-ace** - Code editor functionality
- **mermaid** - Diagram generation
- **axios** - HTTP client for API communication
- **jszip** - File compression/decompression

## Development Environment Setup

### Requirements
- Node.js 22.15.1 (specified in package.json engines)
- Backend service must be running on localhost:4040 for API proxy

### Running with Docker
```bash
git clone https://github.com/mojaloop/ml-testing-toolkit-ui
cd ml-testing-toolkit-ui
docker-compose up
```
Access at http://localhost:6060

### Local Development
```bash
npm install
npm start
```

## Testing Strategy

The project uses **Vitest** for testing with three test categories:
- **Unit tests** (`test/unit/`) - Component and utility testing
- **Integration tests** (`test/integration/`) - Cross-component interaction testing  
- **Functional tests** (`test/functional/`) - End-to-end workflow testing

Test setup is configured in `src/test/setup.ts` with jsdom environment for DOM testing.

## Code Style & Linting

- **ESLint 9** with TypeScript support and React rules
- **@eslint-react** plugin for modern React patterns
- Configured for both JavaScript and TypeScript files
- Import plugin for dependency management
- Formatting rules are mostly disabled (likely using Prettier separately)

## Build & Deployment

- **Vite** configuration optimizes for React with automatic JSX
- **Code splitting** configured for vendor chunks (React, Ant Design, utilities)
- **Source maps** enabled in development
- **Proxy configuration** for backend API during development
- **Node polyfills** included for browser compatibility

## CI/CD Integration

Uses CircleCI with Mojaloop's standardized orb:
- Automated testing and vulnerability scanning
- Docker image building and publishing
- Automated versioning with standard-version
- Container scanning with Grype/Anchore

## File Patterns to Note

- Test files: `**/*.{test,spec}.{js,jsx,ts,tsx}`
- Source files: `src/**/*.{js,jsx,ts,tsx}`
- Configuration files are at project root
- Static assets in `public/` directory
- Electron app configuration in `electron/` directory