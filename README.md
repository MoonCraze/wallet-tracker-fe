# Whale Tracker Admin Frontend

A real-time admin dashboard for monitoring and analyzing Solana whale wallet transfers. Built with Next.js 14, TypeScript, and modern web technologies.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Whale Tracker Admin Frontend is a comprehensive dashboard application designed for monitoring large-scale cryptocurrency transfers on the Solana blockchain. The system provides real-time streaming of transfer events, coordinated trade detection, and analytics capabilities for administrators.

---

## Features

### Core Functionality
- **Real-time Transfer Monitoring** - Live streaming of whale wallet transfers via Server-Sent Events (SSE)
- **Coordinated Trade Detection** - Identification and display of synchronized trading patterns
- **Interactive Analytics** - Visual charts and statistics for transfer data analysis
- **System Configuration** - Administrative controls for tracker settings and excluded tokens

### Technical Features
- **JWT Authentication** - Secure authentication with NextAuth.js
- **Responsive Design** - Mobile-first, responsive layout
- **Dark/Light Mode** - Theme switching with system preference detection
- **Data Caching** - Intelligent caching with TanStack Query
- **Type Safety** - Full TypeScript implementation with strict mode

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.3 |
| Styling | Tailwind CSS 3.4 |
| UI Components | shadcn/ui (Radix UI) |
| State Management | TanStack Query, Zustand |
| HTTP Client | Axios |
| Real-time | Server-Sent Events (SSE) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Authentication | NextAuth.js v4 |
| Testing | Playwright |

---

## Prerequisites

- Node.js 18.17 or later
- npm 9.x or later (or yarn/pnpm)
- Git
- Access to the Whale Tracker backend API

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd whale-tracker-admin-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration (see [Configuration](#configuration) section).

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Configuration

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=https://your-api-domain.com

# SSE Stream Endpoints
NEXT_PUBLIC_SSE_URL=https://your-api-domain.com/stream/all
NEXT_PUBLIC_SSE_TRANSFERS_URL=https://your-api-domain.com/stream/transfers
NEXT_PUBLIC_SSE_COORDINATED_URL=https://your-api-domain.com/stream/coordinated

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-random-secret-key

# API Authentication (if required)
API_AUTH_USERNAME=admin
API_AUTH_PASSWORD=your-password
```

### Generating NEXTAUTH_SECRET

For production, generate a secure secret:

```bash
openssl rand -base64 32
```

---

## Development

### Running the Development Server

```bash
npm run dev
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Adding UI Components

This project uses shadcn/ui. Add new components with:

```bash
npx shadcn@latest add <component-name>
```

### Bundle Analysis

Analyze the production bundle size:

```bash
npm run build:analyze
```

---

## Production Deployment

### Standard Build

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Vercel Deployment

1. Push your code to a Git repository
2. Import the project in Vercel dashboard
3. Configure environment variables in Vercel settings
4. Deploy

---

## Docker Deployment

### Quick Start

1. Configure environment variables:

```bash
cp .env.docker.example .env
```

2. Edit `.env` with your production values.

3. Build and run:

```bash
docker-compose up -d --build
```

### Available Docker Commands

```bash
# Production deployment
docker-compose up -d --build

# Production with enhanced resources
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Development with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild without cache
docker-compose build --no-cache
```

### Docker Files

| File | Description |
|------|-------------|
| `Dockerfile` | Multi-stage production build |
| `Dockerfile.dev` | Development build with hot reload |
| `docker-compose.yml` | Base compose configuration |
| `docker-compose.prod.yml` | Production overrides |
| `docker-compose.dev.yml` | Development overrides |

---

## Project Structure

```
whale-tracker-admin-frontend/
├── e2e/                        # End-to-end tests (Playwright)
├── public/                     # Static assets
│   ├── icons/                  # Application icons
│   └── manifest.json           # PWA manifest
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication routes
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # Main dashboard
│   │   │   ├── analytics/      # Analytics page
│   │   │   ├── config/         # System configuration
│   │   │   ├── coordinated/    # Coordinated trades
│   │   │   ├── live/           # Live feed
│   │   │   └── transfers/      # Transfer history
│   │   ├── api/                # API routes
│   │   │   └── auth/           # NextAuth endpoints
│   │   ├── error.tsx           # Error boundary
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   ├── loading.tsx         # Loading state
│   │   └── not-found.tsx       # 404 page
│   ├── components/
│   │   ├── coordinated/        # Coordinated trade components
│   │   ├── dashboard/          # Dashboard layout components
│   │   ├── providers/          # React context providers
│   │   ├── shared/             # Shared utility components
│   │   ├── transfers/          # Transfer list components
│   │   └── ui/                 # shadcn/ui primitives
│   ├── lib/
│   │   ├── api/                # API client and endpoints
│   │   ├── auth/               # NextAuth configuration
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils.ts            # Utility functions
│   ├── types/                  # Global type declarations
│   └── middleware.ts           # Auth middleware
├── Dockerfile                  # Production Docker image
├── Dockerfile.dev              # Development Docker image
├── docker-compose.yml          # Docker Compose configuration
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:analyze` | Build with bundle analyzer |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:e2e:ui` | Run Playwright with UI |
| `npm run test:e2e:headed` | Run Playwright in headed mode |
| `npm run test:e2e:debug` | Run Playwright in debug mode |
| `npm run test:e2e:report` | Show Playwright test report |

---

## API Integration

### Authentication

The frontend authenticates with the backend using JWT tokens managed by NextAuth.js.

```
POST /api/auth/login
```

### Protected Endpoints

All protected endpoints require a valid JWT token in the Authorization header.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dev/db/transfers` | GET | Retrieve transfer history |
| `/dev/db/coordinated` | GET | Retrieve coordinated trades |
| `/dev/db/stats` | GET | Retrieve database statistics |
| `/dev/config` | GET | Retrieve system configuration |
| `/dev/config` | PUT | Update system configuration |

### SSE Streams (Public)

Real-time event streams do not require authentication.

| Endpoint | Description |
|----------|-------------|
| `/stream/all` | All events stream |
| `/stream/transfers` | Transfer events only |
| `/stream/coordinated` | Coordinated trade events only |

---

## Testing

### End-to-End Tests

The project uses Playwright for end-to-end testing.

```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed browser
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Test Files

Test files are located in the `e2e/` directory:

- `auth.setup.ts` - Authentication setup
- `auth.spec.ts` - Authentication tests
- `config.spec.ts` - Configuration page tests
- `dashboard.spec.ts` - Dashboard tests
- `transfers.spec.ts` - Transfers page tests

---

## Application Routes

| Route | Description | Authentication |
|-------|-------------|----------------|
| `/` | Main dashboard with statistics | Required |
| `/transfers` | Transfer history with filtering | Required |
| `/coordinated` | Coordinated trades list | Required |
| `/analytics` | Charts and analytics | Required |
| `/config` | System configuration | Required |
| `/live` | Full-screen live feed | Public |
| `/login` | Authentication page | Public |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style and conventions
- Use TypeScript strict mode
- Write meaningful commit messages
- Add tests for new features

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Support

For issues and feature requests, please open an issue in the repository.
