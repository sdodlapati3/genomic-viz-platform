# Implementation Plan: Platform Enhancement

> **Document Version**: 1.0  
> **Created**: December 13, 2025  
> **Status**: In Progress

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Immediate Actions (Week 1-2)](#phase-1-immediate-actions)
3. [Phase 2: Medium-Term Improvements (Week 3-4)](#phase-2-medium-term-improvements)
4. [Implementation Timeline](#implementation-timeline)
5. [Success Metrics](#success-metrics)
6. [Risk Assessment](#risk-assessment)

---

## Overview

### Objectives

Transform the genomic-viz-platform from a strong educational foundation to a production-ready, portfolio-quality application by addressing identified gaps in:

- **Learning Completeness**: Exercise solutions across all tutorials
- **Security**: Authentication and input validation
- **Observability**: Error tracking and monitoring
- **Documentation**: API specs and deployment guides
- **Real-time Features**: WebSocket integration
- **Database Management**: Migration system

### Scope

| Category | Items | Estimated Effort |
|----------|-------|------------------|
| Immediate Actions | 5 items | 40-50 hours |
| Medium-Term Improvements | 5 items | 60-80 hours |
| **Total** | **10 items** | **100-130 hours** |

---

## Phase 1: Immediate Actions

### 1.1 Add Exercise Solutions to All Tutorials

**Priority**: High  
**Estimated Time**: 8-10 hours  
**Dependencies**: None

#### Current State
- Only `tutorials/phase-1-frontend/01-svg-canvas/exercises/` has exercise files
- `solutions/` directory exists but is empty
- Other tutorials lack exercises entirely

#### Implementation Plan

```
For each tutorial phase:
├── Phase 1 (4 tutorials)
│   ├── 01-svg-canvas: Add solutions for existing exercises
│   ├── 02-d3-core: Create exercises + solutions
│   ├── 03-lollipop-plot: Create exercises + solutions
│   └── 04-genome-browser: Create exercises + solutions
├── Phase 2 (4 tutorials)
│   ├── 01-rest-api: Create exercises + solutions
│   ├── 02-postgresql: Create exercises + solutions
│   ├── 03-file-parsing: Create exercises + solutions
│   └── 04-r-integration: Create exercises + solutions
├── Phase 3 (5 tutorials)
│   ├── 01-scatter-plot: Create exercises + solutions
│   ├── 02-heatmap: Create exercises + solutions
│   ├── 03-survival-curves: Create exercises + solutions
│   ├── 04-volcano-plot: Create exercises + solutions
│   └── 05-oncoprint: Create exercises + solutions
└── Phase 4 (4 tutorials)
    ├── 01-testing: Create exercises + solutions
    ├── 02-cicd: Create exercises + solutions
    ├── 03-ai-chatbot: Create exercises + solutions
    └── 04-rust-parsing: Create exercises + solutions
```

#### Exercise Template Structure

Each exercise should include:
```markdown
# Exercise X: [Title]

## Objective
Clear description of what the learner will build/achieve.

## Requirements
### Basic (Required)
- Requirement 1
- Requirement 2

### Intermediate (Recommended)
- Requirement 3
- Requirement 4

### Advanced (Challenge)
- Requirement 5

## Sample Data
```javascript
// Provided data structures
```

## Hints
1. Hint for getting started
2. Hint for common gotchas

## Expected Output
Description or screenshot of expected result.
```

#### Deliverables
- [ ] 17 tutorials with exercises/ directories
- [ ] 17 tutorials with solutions/ directories
- [ ] Minimum 2 exercises per tutorial (34 total)
- [ ] All solutions tested and verified working

---

### 1.2 Implement E2E Tests with Playwright

**Priority**: High  
**Estimated Time**: 12-15 hours  
**Dependencies**: Capstone application running

#### Current State
- Playwright mentioned in tech stack but not implemented
- Only unit tests exist (Vitest)
- No visual regression testing

#### Implementation Plan

##### Step 1: Setup Playwright in Capstone
```bash
capstone/
├── e2e/
│   ├── fixtures/
│   │   └── test-data.ts
│   ├── pages/
│   │   ├── DashboardPage.ts
│   │   ├── MutationsPage.ts
│   │   ├── ExpressionPage.ts
│   │   ├── SurvivalPage.ts
│   │   └── ChatPage.ts
│   ├── tests/
│   │   ├── dashboard.spec.ts
│   │   ├── mutations.spec.ts
│   │   ├── expression.spec.ts
│   │   ├── survival.spec.ts
│   │   ├── chat.spec.ts
│   │   └── api.spec.ts
│   └── playwright.config.ts
├── package.json (add playwright deps)
└── .github/workflows/e2e.yml
```

##### Step 2: Test Coverage Matrix

| Feature | Test Cases | Priority |
|---------|------------|----------|
| Dashboard | Load, navigation, stats display | High |
| Mutations View | Filter, search, lollipop render | High |
| Expression View | Heatmap render, gene selection | High |
| Survival View | Curve render, cohort selection | Medium |
| Chat Interface | Send message, receive response | Medium |
| File Upload | VCF upload, parsing feedback | High |
| Responsive Design | Mobile, tablet, desktop | Low |

##### Step 3: Page Object Model Implementation

```typescript
// e2e/pages/MutationsPage.ts
export class MutationsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/mutations');
  }

  async filterByGene(gene: string) {
    await this.page.fill('[data-testid="gene-filter"]', gene);
    await this.page.click('[data-testid="apply-filter"]');
  }

  async getLollipopMutations() {
    return this.page.locator('.mutation-marker').count();
  }

  async waitForVisualization() {
    await this.page.waitForSelector('.lollipop-plot svg');
  }
}
```

##### Step 4: CI Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run dev &
      - run: npx wait-on http://localhost:5173
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

#### Deliverables
- [ ] Playwright configuration file
- [ ] 5 page object classes
- [ ] 15+ E2E test cases
- [ ] CI workflow for E2E tests
- [ ] Visual regression baseline images

---

### 1.3 Add Authentication Layer to Capstone API

**Priority**: Critical  
**Estimated Time**: 10-12 hours  
**Dependencies**: None

#### Current State
- No authentication on any endpoints
- No user management
- No role-based access control

#### Implementation Plan

##### Architecture Decision: JWT + Passport.js

```
Authentication Flow:
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │────▶│  API    │────▶│   DB    │
└─────────┘     └─────────┘     └─────────┘
     │               │               │
     │  1. Login     │               │
     │──────────────▶│  2. Verify    │
     │               │──────────────▶│
     │               │  3. User data │
     │               │◀──────────────│
     │  4. JWT Token │               │
     │◀──────────────│               │
     │               │               │
     │  5. Request   │               │
     │  + Bearer JWT │               │
     │──────────────▶│  6. Validate  │
     │               │     Token     │
     │  7. Response  │               │
     │◀──────────────│               │
```

##### Step 1: File Structure

```
capstone/server/src/
├── auth/
│   ├── index.js
│   ├── strategies/
│   │   ├── jwt.strategy.js
│   │   └── local.strategy.js
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   └── rateLimiter.js
│   └── utils/
│       ├── password.js
│       └── tokens.js
├── routes/
│   └── auth.routes.js (new)
├── models/
│   └── user.model.js (new)
└── services/
    └── auth.service.js (new)
```

##### Step 2: User Model

```javascript
// models/user.model.js
const userSchema = {
  id: 'uuid',
  email: 'string (unique)',
  passwordHash: 'string',
  role: 'enum (admin, researcher, viewer)',
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  lastLogin: 'timestamp',
  isActive: 'boolean'
};
```

##### Step 3: API Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/register` | POST | No | Create new user |
| `/api/auth/login` | POST | No | Authenticate user |
| `/api/auth/logout` | POST | Yes | Invalidate token |
| `/api/auth/refresh` | POST | Yes | Refresh JWT token |
| `/api/auth/me` | GET | Yes | Get current user |
| `/api/auth/password` | PUT | Yes | Change password |

##### Step 4: Middleware Implementation

```javascript
// middleware/authenticate.js
export const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: info?.message || 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// middleware/authorize.js
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};
```

##### Step 5: Protected Routes

```javascript
// Apply to existing routes
router.get('/api/mutations', authenticate, getMutations);
router.post('/api/upload', authenticate, authorize('admin', 'researcher'), uploadFile);
router.delete('/api/data/:id', authenticate, authorize('admin'), deleteData);
```

#### Deliverables
- [ ] User model and database table
- [ ] JWT authentication strategy
- [ ] Login/register/logout endpoints
- [ ] Middleware for route protection
- [ ] Role-based authorization
- [ ] Password hashing with bcrypt
- [ ] Token refresh mechanism
- [ ] Rate limiting on auth endpoints

---

### 1.4 Create Environment Configuration

**Priority**: Critical  
**Estimated Time**: 2-3 hours  
**Dependencies**: None

#### Current State
- No `.env.example` file
- Hardcoded configuration values
- No environment validation

#### Implementation Plan

##### Step 1: Create .env.example Files

```bash
# Root level
.env.example

# Capstone specific
capstone/.env.example
capstone/client/.env.example
capstone/server/.env.example
```

##### Step 2: Root .env.example

```bash
# ===========================================
# Genomic Visualization Platform Configuration
# ===========================================
# Copy this file to .env and fill in values

# -----------------
# Node Environment
# -----------------
NODE_ENV=development
# Options: development, staging, production

# -----------------
# Server Configuration
# -----------------
PORT=3001
HOST=localhost
API_PREFIX=/api

# -----------------
# Database Configuration
# -----------------
DB_HOST=localhost
DB_PORT=5432
DB_NAME=genomic_viz
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_SSL=false

# Connection pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10

# -----------------
# Redis Configuration
# -----------------
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# -----------------
# Authentication
# -----------------
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Password hashing rounds
BCRYPT_ROUNDS=12

# -----------------
# External Services
# -----------------
# OpenAI (for AI chatbot)
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4

# Sentry (error tracking)
SENTRY_DSN=https://your-sentry-dsn

# -----------------
# File Upload
# -----------------
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
# 50MB in bytes

# Allowed file types
ALLOWED_EXTENSIONS=.vcf,.maf,.csv,.tsv,.txt

# -----------------
# CORS Configuration
# -----------------
CORS_ORIGIN=http://localhost:5173
# Comma-separated for multiple origins

# -----------------
# Rate Limiting
# -----------------
RATE_LIMIT_WINDOW_MS=900000
# 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# -----------------
# Logging
# -----------------
LOG_LEVEL=info
# Options: error, warn, info, http, verbose, debug, silly

LOG_FORMAT=combined
# Options: combined, common, dev, short, tiny

# -----------------
# Feature Flags
# -----------------
FEATURE_AI_CHAT=true
FEATURE_FILE_UPLOAD=true
FEATURE_WEBSOCKET=false
```

##### Step 3: Environment Validation

```javascript
// config/env.validation.js
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  
  PORT: Joi.number().default(3001),
  
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  
  // ... more validations
}).unknown();

export function validateEnv() {
  const { error, value } = envSchema.validate(process.env);
  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }
  return value;
}
```

#### Deliverables
- [ ] `.env.example` at root level
- [ ] `.env.example` for capstone/server
- [ ] `.env.example` for capstone/client
- [ ] Environment validation module
- [ ] Updated `.gitignore` for `.env` files
- [ ] Documentation for each variable

---

### 1.5 Add API Documentation (OpenAPI/Swagger)

**Priority**: High  
**Estimated Time**: 8-10 hours  
**Dependencies**: Authentication implementation

#### Current State
- No API documentation
- No interactive API explorer
- Endpoints documented only in code comments

#### Implementation Plan

##### Step 1: Setup Swagger/OpenAPI

```bash
capstone/server/
├── src/
│   └── docs/
│       ├── swagger.js           # Swagger configuration
│       ├── schemas/             # Reusable schemas
│       │   ├── mutation.schema.js
│       │   ├── gene.schema.js
│       │   ├── sample.schema.js
│       │   └── user.schema.js
│       └── paths/               # Endpoint documentation
│           ├── mutations.paths.js
│           ├── genes.paths.js
│           ├── samples.paths.js
│           ├── auth.paths.js
│           └── upload.paths.js
└── docs/
    └── openapi.yaml            # Generated spec
```

##### Step 2: Swagger Configuration

```javascript
// docs/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini-ProteinPaint API',
      version: '1.0.0',
      description: `
        RESTful API for the Mini-ProteinPaint genomic visualization platform.
        
        ## Authentication
        Most endpoints require JWT authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <token>\`
        
        ## Rate Limiting
        - 100 requests per 15 minutes for authenticated users
        - 20 requests per 15 minutes for unauthenticated requests
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js', './src/docs/schemas/*.js']
};

export const specs = swaggerJsdoc(options);
export { swaggerUi };
```

##### Step 3: Schema Definitions

```javascript
// docs/schemas/mutation.schema.js
/**
 * @swagger
 * components:
 *   schemas:
 *     Mutation:
 *       type: object
 *       required:
 *         - id
 *         - gene
 *         - position
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique mutation identifier
 *         gene:
 *           type: string
 *           example: TP53
 *           description: Gene symbol
 *         chromosome:
 *           type: string
 *           example: chr17
 *         position:
 *           type: integer
 *           example: 7577120
 *           description: Genomic position
 *         refAllele:
 *           type: string
 *           example: G
 *         altAllele:
 *           type: string
 *           example: A
 *         type:
 *           type: string
 *           enum: [missense, nonsense, frameshift, splice, silent]
 *         aaChange:
 *           type: string
 *           example: R248Q
 *           description: Amino acid change
 *         sampleCount:
 *           type: integer
 *           description: Number of samples with this mutation
 *     
 *     MutationList:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Mutation'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 *     
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           example: 150
 *         totalPages:
 *           type: integer
 *           example: 8
 */
```

##### Step 4: Path Documentation

```javascript
// docs/paths/mutations.paths.js
/**
 * @swagger
 * /api/mutations:
 *   get:
 *     summary: Get all mutations
 *     description: Retrieve a paginated list of mutations with optional filtering
 *     tags: [Mutations]
 *     parameters:
 *       - in: query
 *         name: gene
 *         schema:
 *           type: string
 *         description: Filter by gene symbol
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [missense, nonsense, frameshift, splice, silent]
 *         description: Filter by mutation type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MutationList'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
```

##### Step 5: API Documentation Page

```javascript
// index.js - Add swagger route
import { specs, swaggerUi } from './docs/swagger.js';

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Mini-ProteinPaint API Docs'
}));

// Serve OpenAPI spec as JSON
app.get('/api/docs.json', (req, res) => {
  res.json(specs);
});
```

#### Deliverables
- [ ] Swagger/OpenAPI setup
- [ ] All existing endpoints documented
- [ ] Interactive API explorer at `/api/docs`
- [ ] Downloadable OpenAPI spec
- [ ] Request/response examples
- [ ] Error response documentation

---

## Phase 2: Medium-Term Improvements

### 2.1 Database Migration System

**Priority**: High  
**Estimated Time**: 10-12 hours  
**Dependencies**: PostgreSQL setup

#### Implementation Plan

##### Technology Choice: Knex.js

Reasons:
- Lightweight and flexible
- Works well with raw SQL when needed
- Good TypeScript support
- Simple migration CLI

##### File Structure

```
capstone/server/
├── knexfile.js
├── src/
│   └── db/
│       ├── index.js          # Database connection
│       ├── migrations/
│       │   ├── 20251213_001_create_users.js
│       │   ├── 20251213_002_create_mutations.js
│       │   ├── 20251213_003_create_samples.js
│       │   ├── 20251213_004_create_genes.js
│       │   └── 20251213_005_create_audit_log.js
│       └── seeds/
│           ├── 01_users.js
│           ├── 02_genes.js
│           ├── 03_mutations.js
│           └── 04_samples.js
```

##### Migration Example

```javascript
// migrations/20251213_001_create_users.js
export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.enum('role', ['admin', 'researcher', 'viewer']).defaultTo('viewer');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('last_login');
    
    table.index('email');
    table.index('role');
  });
}

export async function down(knex) {
  await knex.schema.dropTable('users');
}
```

##### NPM Scripts

```json
{
  "scripts": {
    "db:migrate": "knex migrate:latest",
    "db:migrate:rollback": "knex migrate:rollback",
    "db:migrate:make": "knex migrate:make",
    "db:seed": "knex seed:run",
    "db:reset": "knex migrate:rollback --all && knex migrate:latest && knex seed:run"
  }
}
```

#### Deliverables
- [ ] Knex configuration
- [ ] 5+ migration files
- [ ] Seed data files
- [ ] NPM scripts for migration commands
- [ ] CI integration for migrations
- [ ] Rollback testing

---

### 2.2 Error Tracking Integration (Sentry)

**Priority**: High  
**Estimated Time**: 6-8 hours  
**Dependencies**: None

#### Implementation Plan

##### Setup Locations

```
capstone/
├── client/
│   └── src/
│       └── utils/
│           └── sentry.js     # Frontend Sentry setup
└── server/
    └── src/
        └── utils/
            └── sentry.js     # Backend Sentry setup
```

##### Backend Integration

```javascript
// server/src/utils/sentry.js
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry(app) {
  if (!process.env.SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0.1,
  });

  // Request handler (must be first middleware)
  app.use(Sentry.Handlers.requestHandler());
  
  // Tracing handler
  app.use(Sentry.Handlers.tracingHandler());

  return Sentry;
}

// Error handler (must be before other error handlers)
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture 4xx and 5xx errors
      return error.status >= 400;
    },
  });
}
```

##### Frontend Integration

```javascript
// client/src/utils/sentry.js
import * as Sentry from '@sentry/browser';

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Capture custom errors
export function captureError(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Set user context
export function setUser(user) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}
```

#### Deliverables
- [ ] Backend Sentry integration
- [ ] Frontend Sentry integration
- [ ] Error boundary component
- [ ] Custom error capturing utilities
- [ ] User context tracking
- [ ] Release tracking setup

---

### 2.3 Input Validation Middleware (Zod)

**Priority**: High  
**Estimated Time**: 8-10 hours  
**Dependencies**: None

#### Implementation Plan

##### File Structure

```
capstone/server/src/
├── validation/
│   ├── index.js              # Validation middleware
│   ├── schemas/
│   │   ├── auth.schema.js
│   │   ├── mutation.schema.js
│   │   ├── sample.schema.js
│   │   ├── gene.schema.js
│   │   └── upload.schema.js
│   └── validators/
│       ├── query.validator.js
│       ├── body.validator.js
│       └── params.validator.js
```

##### Schema Definitions

```javascript
// validation/schemas/mutation.schema.js
import { z } from 'zod';

export const mutationQuerySchema = z.object({
  gene: z.string().optional(),
  type: z.enum(['missense', 'nonsense', 'frameshift', 'splice', 'silent']).optional(),
  chromosome: z.string().regex(/^chr([1-9]|1[0-9]|2[0-2]|X|Y)$/).optional(),
  minPosition: z.coerce.number().int().positive().optional(),
  maxPosition: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['gene', 'position', 'type', 'sampleCount']).default('gene'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const mutationCreateSchema = z.object({
  gene: z.string().min(1).max(50),
  chromosome: z.string().regex(/^chr([1-9]|1[0-9]|2[0-2]|X|Y)$/),
  position: z.number().int().positive(),
  refAllele: z.string().regex(/^[ACGT]+$/),
  altAllele: z.string().regex(/^[ACGT]+$/),
  type: z.enum(['missense', 'nonsense', 'frameshift', 'splice', 'silent']),
  aaChange: z.string().optional(),
  sampleId: z.string().uuid().optional(),
});

export const mutationIdSchema = z.object({
  id: z.string().uuid(),
});
```

##### Validation Middleware

```javascript
// validation/index.js
import { ZodError } from 'zod';

export function validate(schema, source = 'body') {
  return async (req, res, next) => {
    try {
      const data = source === 'body' ? req.body 
                 : source === 'query' ? req.query 
                 : req.params;
      
      const validated = await schema.parseAsync(data);
      
      // Replace with validated & transformed data
      if (source === 'body') req.body = validated;
      else if (source === 'query') req.query = validated;
      else req.params = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      }
      next(error);
    }
  };
}

// Usage in routes
router.get('/mutations', 
  validate(mutationQuerySchema, 'query'),
  getMutations
);

router.post('/mutations',
  authenticate,
  validate(mutationCreateSchema, 'body'),
  createMutation
);
```

#### Deliverables
- [ ] Zod schema definitions for all endpoints
- [ ] Reusable validation middleware
- [ ] Custom error formatting
- [ ] Type inference from schemas
- [ ] Documentation of validation rules

---

### 2.4 WebSocket Support for Real-Time Features

**Priority**: Medium  
**Estimated Time**: 12-15 hours  
**Dependencies**: Authentication

#### Implementation Plan

##### Use Case: Real-Time Analysis Progress

```
WebSocket Events:
├── analysis:start      → Client initiates analysis
├── analysis:progress   → Server sends progress updates
├── analysis:complete   → Analysis finished
├── analysis:error      → Analysis failed
├── file:upload:progress → File upload progress
├── notification:new    → New system notification
└── user:online         → User presence updates
```

##### File Structure

```
capstone/server/src/
├── websocket/
│   ├── index.js              # WebSocket server setup
│   ├── handlers/
│   │   ├── analysis.handler.js
│   │   ├── upload.handler.js
│   │   └── notification.handler.js
│   ├── middleware/
│   │   └── wsAuth.middleware.js
│   └── events.js             # Event type constants
```

##### Implementation

```javascript
// websocket/index.js
import { Server } from 'socket.io';
import { verifyToken } from '../auth/utils/tokens.js';

export function initWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    try {
      const user = await verifyToken(token);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.email}`);
    
    // Join user-specific room
    socket.join(`user:${socket.user.id}`);
    
    // Handle analysis events
    socket.on('analysis:start', (data) => {
      handleAnalysisStart(io, socket, data);
    });
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.email}`);
    });
  });

  return io;
}
```

##### Client Integration

```javascript
// client/src/services/websocket.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    this.socket = io(import.meta.env.VITE_WS_URL, {
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
    });

    return this;
  }

  on(event, callback) {
    this.socket?.on(event, callback);
    return this;
  }

  emit(event, data) {
    this.socket?.emit(event, data);
    return this;
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const wsService = new WebSocketService();
```

#### Deliverables
- [ ] Socket.io server setup
- [ ] WebSocket authentication
- [ ] Analysis progress events
- [ ] File upload progress events
- [ ] Client WebSocket service
- [ ] React hooks for WebSocket
- [ ] Connection status indicator

---

### 2.5 Deployment Documentation

**Priority**: Medium  
**Estimated Time**: 8-10 hours  
**Dependencies**: All other improvements

#### Implementation Plan

##### Documentation Structure

```
docs/
├── DEPLOYMENT.md              # Main deployment guide
├── deployment/
│   ├── aws/
│   │   ├── README.md
│   │   ├── ecs-task-definition.json
│   │   ├── cloudformation.yml
│   │   └── scripts/
│   │       ├── deploy.sh
│   │       └── rollback.sh
│   ├── docker/
│   │   ├── README.md
│   │   ├── Dockerfile.client
│   │   ├── Dockerfile.server
│   │   └── docker-compose.prod.yml
│   ├── kubernetes/
│   │   ├── README.md
│   │   ├── namespace.yml
│   │   ├── deployment.yml
│   │   ├── service.yml
│   │   ├── ingress.yml
│   │   └── secrets.yml
│   └── heroku/
│       ├── README.md
│       ├── Procfile
│       └── app.json
```

##### Main Deployment Guide Outline

```markdown
# Deployment Guide

## Quick Start
- Docker Compose (simplest)
- Heroku (free tier)

## Production Deployments
- AWS ECS
- Kubernetes (GKE/EKS)
- DigitalOcean App Platform

## Configuration
- Environment variables
- Secrets management
- SSL certificates

## Database
- PostgreSQL setup
- Migrations in production
- Backup strategies

## Monitoring
- Health checks
- Logging
- Alerting

## Scaling
- Horizontal scaling
- Load balancing
- Caching strategies

## Security
- HTTPS setup
- CORS configuration
- Rate limiting

## Troubleshooting
- Common issues
- Debug mode
- Log analysis
```

#### Deliverables
- [ ] Main deployment guide
- [ ] Docker production configs
- [ ] AWS deployment scripts
- [ ] Kubernetes manifests
- [ ] Heroku configuration
- [ ] Environment checklist
- [ ] Troubleshooting guide

---

## Implementation Timeline

```
Week 1 (Days 1-5):
├── Day 1-2: Environment configuration (.env files)
├── Day 2-3: Authentication system (Part 1)
├── Day 4-5: Authentication system (Part 2)

Week 2 (Days 6-10):
├── Day 6-7: API Documentation (Swagger)
├── Day 8-9: E2E Tests Setup (Playwright)
├── Day 10: Exercise solutions (Phase 1)

Week 3 (Days 11-15):
├── Day 11-12: Database migrations (Knex)
├── Day 13-14: Input validation (Zod)
├── Day 15: Exercise solutions (Phase 2)

Week 4 (Days 16-20):
├── Day 16-17: Error tracking (Sentry)
├── Day 18-19: WebSocket implementation
├── Day 20: Deployment documentation
└── Exercise solutions (Phase 3-4)
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Coverage | >80% | Jest/Vitest coverage report |
| E2E Tests | >15 scenarios | Playwright test count |
| API Documentation | 100% endpoints | Swagger completeness |
| Exercise Completion | 34 exercises | File count |
| Security Score | A grade | npm audit, OWASP check |
| Lighthouse Score | >90 | Performance audit |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Authentication complexity | Medium | High | Use well-tested libraries (Passport.js) |
| WebSocket scaling | Low | Medium | Redis adapter for horizontal scaling |
| Database migration conflicts | Medium | High | Thorough testing, rollback scripts |
| E2E test flakiness | High | Medium | Retry logic, proper wait conditions |
| Time overrun | Medium | Medium | Prioritize critical items first |

---

## Checklist Summary

### Phase 1: Immediate Actions
- [ ] 1.1 Exercise solutions (17 tutorials)
- [ ] 1.2 E2E tests with Playwright
- [ ] 1.3 Authentication layer
- [ ] 1.4 Environment configuration
- [ ] 1.5 API documentation

### Phase 2: Medium-Term
- [ ] 2.1 Database migrations
- [ ] 2.2 Error tracking (Sentry)
- [ ] 2.3 Input validation (Zod)
- [ ] 2.4 WebSocket support
- [ ] 2.5 Deployment documentation

---

*Document maintained by: Development Team*  
*Last updated: December 13, 2025*
