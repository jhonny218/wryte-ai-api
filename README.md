# Wryte AI API

## Overview

Wryte AI API is a comprehensive backend service for the Wryte AI platform, designed to help organizations streamline their content creation workflow using AI. The platform enables teams to:

- **Manage Organizations**: Create and manage multi-user organizations with role-based access
- **Configure Content Settings**: Customize tone, style, target audience, and publishing preferences
- **AI-Powered Content Generation**: Automated blog title, outline, and full content generation using Gemini AI
- **Calendar Management**: Plan and schedule content across multiple platforms
- **Asynchronous Job Processing**: Background workers handle resource-intensive AI generation tasks

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client Layer                               │
│                    (Frontend Applications)                           │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ HTTPS/REST API
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│                         API Layer (Express)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │    Auth      │  │   Routes     │  │  Middleware  │             │
│  │  (Clerk)     │  │  (v1 API)    │  │   (Logger,   │             │
│  │              │  │              │  │    Error)    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
┌───────────────────▼──────────┐  ┌──────────▼──────────────────────┐
│    Controllers/Services       │  │      Job Queue (BullMQ)        │
│  ┌────────────────────────┐  │  │  ┌──────────────────────────┐  │
│  │  • Organizations       │  │  │  │  • Title Generation      │  │
│  │  • Settings            │  │  │  │  • Outline Generation    │  │
│  │  • Blog Management     │  │  │  │  • Blog Generation       │  │
│  │  • Calendar            │  │  │  │  • Job Status Tracking   │  │
│  │  • User Management     │  │  │  └──────────────────────────┘  │
│  └────────────────────────┘  │  │                                 │
└───────────────┬───────────────┘  └─────────────┬───────────────────┘
                │                                 │
                │                    ┌────────────▼───────────┐
                │                    │   Worker Processes     │
                │                    │  ┌──────────────────┐  │
                │                    │  │  • Gemini AI API │  │
                │                    │  │  • Job Processor │  │
                │                    │  └──────────────────┘  │
                │                    └────────────────────────┘
                │                                 │
                │                                 │
┌───────────────▼─────────────────────────────────▼───────────────────┐
│                        Data Layer                                    │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐   │
│  │   PostgreSQL (Neon)      │  │        Redis                  │   │
│  │  • Organizations         │  │  • Job Queue                  │   │
│  │  • Users & Members       │  │  • Cache                      │   │
│  │  • Content (Titles,      │  │  • Session Storage            │   │
│  │    Outlines, Blogs)      │  │                               │   │
│  │  • Settings & Calendar   │  │                               │   │
│  └──────────────────────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Core Technologies

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript (strict mode)
- **Framework**: Express.js v5
- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: Prisma with connection pooling
- **Validation**: Zod schemas
- **Authentication**: Clerk
- **Job Queue**: BullMQ with Redis
- **AI Provider**: Google Gemini AI API

### Development Tools

- **Testing**: Playwright for E2E API testing, with comprehensive unit and integration test coverage
- **Linting**: ESLint
- **Logging**: Winston with daily rotate file
- **Environment**: dotenv
- **Process Management**: tsx for development

### Key Features

- 🔐 **Secure Authentication**: Clerk integration with test mode bypass
- 🏢 **Multi-tenant**: Organization-based data isolation
- 🎯 **Role-based Access**: Owner/Admin/Member permissions
- ⚡ **Async Processing**: Background workers for AI generation
- 📊 **Comprehensive Logging**: Request/response logging with Winston
- 🧪 **Comprehensive Testing**: Unit, integration, and 21+ E2E API tests with Playwright
- 🔄 **Database Migrations**: Prisma migrations with version control

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: v14 or higher (or Neon account)
- **Redis**: v6 or higher (for job queue)
- **Clerk Account**: For authentication (or use test mode)
- **Gemini AI API Key**: For content generation

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/jhonny218/wryte-ai-api.git
    cd wryte-ai-api
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Set up environment variables**

    ```bash
    cp .env.example .env
    ```

    Update `.env` with your credentials:

    ```env
    # Database
    DATABASE_URL="postgresql://user:password@host:5432/dbname"

    # Redis
    REDIS_HOST="localhost"
    REDIS_PORT=6379

    # Clerk Authentication
    CLERK_PUBLISHABLE_KEY="pk_test_..."
    CLERK_SECRET_KEY="sk_test_..."

    # Gemini AI
    GEMINI_API_KEY="your_gemini_api_key"

    # Server
    PORT=3000
    NODE_ENV="development"
    ```

4.  **Run database migrations**

    ```bash
    npx prisma migrate dev
    ```

5.  **Generate Prisma Client**
    ```bash
    npx prisma generate
    ```

### Development

**Start the development server:**

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot reloading enabled.

**Start worker processes (in a separate terminal):**

```bash
npm run workers
```

**View Prisma Studio (database GUI):**

```bash
npx prisma studio
```

### Testing

**Run E2E tests:**

```bash
npm run test:e2e
```

**Run specific test file:**

```bash
npm run test:e2e -- organizations.spec.ts
```

**Test environment setup:**

- Uses separate test database
- Loads `.env.test` configuration
- Bypasses Clerk authentication with test headers
- Runs 4 parallel workers with transaction isolation

## API Documentation

### Interactive Documentation (Swagger UI)

Access the interactive API documentation with "Try it out" functionality:

```
http://localhost:3000/api-docs
```

Features:

- 🔍 Browse all 22 documented endpoints organized by tags
- 🧪 Test endpoints directly in the browser with live requests
- 📝 View detailed request/response schemas with validation rules
- 🔐 Authenticate with Clerk tokens (saved in browser)
- 📋 Copy curl commands for command-line testing
- ⚡ See real-time response data with syntax highlighting
- 🎨 Dark/light mode support
- 📱 Mobile-responsive interface

The documentation is **auto-generated** from TypeScript code using [tsoa](https://tsoa-community.github.io/docs/) and follows the OpenAPI 3.0 specification (2189 lines).

For implementation details and developer guides, see:

- [API Documentation Guide](./docs/API_DOCUMENTATION.md) - Complete tsoa usage guide
- [tsoa Quick Reference](./docs/TSOA_QUICK_REFERENCE.md) - Decorator reference card
- [Implementation Summary](./docs/TSOA_IMPLEMENTATION_SUMMARY.md) - Architecture overview

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

All endpoints (except health checks) require authentication via Clerk. Include the session token in the `Authorization` header:

```
Authorization: Bearer <clerk_session_token>
```

In the Swagger UI, click the **Authorize** button (🔒) and paste your Clerk token.

### API Endpoints (22 Total)

#### Health (2 endpoints)

- `GET /health` - Full health check (database + Redis status)
- `GET /health/ping` - Simple ping response

#### Organizations (5 endpoints)

- `POST /api/v1/organizations` - Create new organization
- `GET /api/v1/organizations` - List user's organizations with role info
- `GET /api/v1/organizations/{orgId}` - Get organization by ID
- `GET /api/v1/organizations/slug/{slug}` - Get organization by slug
- `PATCH /api/v1/organizations/{orgId}` - Update organization details

#### Settings (2 endpoints)

- `GET /api/v1/organizations/{orgId}/settings` - Get content settings
- `POST /api/v1/organizations/{orgId}/settings` - Create or update settings (upsert)

#### Titles (3 endpoints)

- `GET /api/v1/organizations/{orgId}/titles` - List all blog titles
- `PATCH /api/v1/organizations/{orgId}/titles/{titleId}` - Update title (status, scheduled date)
- `DELETE /api/v1/organizations/{orgId}/titles/{titleId}` - Delete title

#### Outlines (3 endpoints)

- `GET /api/v1/organizations/{orgId}/outlines` - List all blog outlines
- `PATCH /api/v1/organizations/{orgId}/outlines/{outlineId}` - Update outline (structure, SEO keywords)
- `DELETE /api/v1/organizations/{orgId}/outlines/{outlineId}` - Delete outline

#### Blogs (3 endpoints)

- `GET /api/v1/organizations/{orgId}/blogs` - List all blogs
- `PATCH /api/v1/organizations/{orgId}/blogs/{blogId}` - Update blog content and status
- `DELETE /api/v1/organizations/{orgId}/blogs/{blogId}` - Delete blog

#### Jobs (3 endpoints) - Async AI Generation

- `POST /api/v1/jobs/title` - Generate blog titles (returns job ID)
- `POST /api/v1/jobs/outline` - Generate blog outline (returns job ID)
- `POST /api/v1/jobs/blog` - Generate full blog content (returns job ID)

All generation endpoints return `202 Accepted` with job details. Poll job status using the job ID or implement webhooks to get results when processing completes.

#### Calendar (1 endpoint)

- `GET /api/v1/calendar/events?year=2025&month=02&orgId=...` - Get scheduled content events

## Project Structure

```
wryte-ai-api/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration history
├── src/
│   ├── config/
│   │   └── env.ts            # Environment validation
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   ├── middleware/           # Express middleware
│   ├── routes/               # API route definitions
│   ├── types/                # TypeScript types
│   ├── utils/                # Utilities (logger, errors, etc.)
│   ├── workers/              # BullMQ job processors
│   ├── app.ts               # Express app configuration
│   ├── server.ts            # HTTP server
│   ├── index.ts             # Main entry point
│   └── workers.ts           # Worker entry point
├── src/tests/
│   └── e2e/
│       ├── specs/           # Test specifications
│       ├── helpers/         # Test utilities
│       └── global-*.ts      # Test setup/teardown
└── logs/                    # Application logs

```

## Database Schema

The database uses PostgreSQL with the following main entities:

- **User**: User accounts (synced with Clerk)
- **Organization**: Multi-tenant organizations
- **OrganizationMember**: User-organization relationships with roles
- **ContentSettings**: Organization content preferences
- **BlogTitle**: Generated title ideas
- **BlogOutline**: Structured blog outlines
- **Blog**: Full blog content with SEO metadata
- **CalendarEvent**: Content scheduling
- **Job**: Async job tracking

See `prisma/schema.prisma` for the complete schema with relationships.

## Job Processing

The platform uses BullMQ for asynchronous job processing:

1. **Client Request**: Client submits generation request to API
2. **Job Creation**: API creates job record and adds to Redis queue
3. **Immediate Response**: API returns 202 Accepted with job ID
4. **Worker Processing**: Background worker picks up job from queue
5. **AI Generation**: Worker calls Gemini AI API
6. **Result Storage**: Worker saves result to database
7. **Status Update**: Job status updated (PENDING → COMPLETED/FAILED)

Job types:

- `GENERATE_TITLES`: Create multiple blog title ideas
- `GENERATE_OUTLINE`: Create structured blog outline
- `GENERATE_BLOG`: Generate full blog content

## Logging

Logs are written to `logs/` directory:

- `combined-%DATE%.log`: All logs
- `error-%DATE%.log`: Error logs only
- Console output in development

Log format includes:

- Timestamp
- Log level
- Request ID (for tracing)
- Message and metadata

## Environment Variables

| Variable                | Description                               | Required           |
| ----------------------- | ----------------------------------------- | ------------------ |
| `DATABASE_URL`          | PostgreSQL connection string              | Yes                |
| `REDIS_HOST`            | Redis server host                         | Yes                |
| `REDIS_PORT`            | Redis server port                         | Yes                |
| `CLERK_PUBLISHABLE_KEY` | Clerk public key                          | Yes                |
| `CLERK_SECRET_KEY`      | Clerk secret key                          | Yes                |
| `GEMINI_API_KEY`        | Google Gemini AI API key                  | Yes                |
| `PORT`                  | Server port                               | No (default: 3000) |
| `NODE_ENV`              | Environment (development/production/test) | Yes                |

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database (enable connection pooling)
- [ ] Set up Redis instance
- [ ] Configure Clerk production keys
- [ ] Set secure Gemini API key
- [ ] Enable CORS for production domains
- [ ] Set up process manager (PM2)
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL/TLS certificates
- [ ] Configure log rotation
- [ ] Set up monitoring and alerts
- [ ] Run database migrations

### Recommended Hosting

- **API**: Railway, Render, or Fly.io
- **Database**: Neon (PostgreSQL with autoscaling)
- **Redis**: Upstash or Redis Cloud
- **Workers**: Same platform as API (separate process)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with 🧠 using TypeScript, Express, and Gemini AI**
