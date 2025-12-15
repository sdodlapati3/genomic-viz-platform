[← Back to Tutorials Index](../../README.md)

---

# Tutorial 2.1: Node.js REST API for Genomics

## Overview

This tutorial introduces building RESTful APIs with Node.js and Express.js for serving genomic data. You'll learn how to create endpoints for genes, variants, and samples that can power visualization frontends.

## Learning Objectives

After completing this tutorial, you will be able to:

1. Set up an Express.js server with proper middleware
2. Design RESTful API endpoints for genomic data
3. Implement filtering, pagination, and error handling
4. Structure routes and controllers for maintainability
5. Enable CORS for frontend integration

## Project Structure

```
01-rest-api/
├── package.json          # Dependencies and scripts
├── README.md             # This file
├── start-tutorial.sh     # Quick start script
└── src/
    ├── server.js         # Express app entry point
    ├── data/
    │   └── genomicData.js # Sample genomic data
    ├── routes/
    │   ├── genes.js      # Gene endpoints
    │   ├── variants.js   # Variant endpoints
    │   └── samples.js    # Sample endpoints
    └── middleware/
        └── errorHandler.js # Error handling
```

## Getting Started

### Quick Start

```bash
cd tutorials/phase-2-backend/01-rest-api
npm install
npm run dev
```

Or use the start script:

```bash
./start-tutorial.sh
```

### Manual Start

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Or start production server
npm start
```

The server will start at **http://localhost:3001**

## API Documentation

### Base URL

```
http://localhost:3001/api
```

### Available Endpoints

#### Genes

| Method | Endpoint                             | Description                   |
| ------ | ------------------------------------ | ----------------------------- |
| GET    | `/api/genes`                         | List all genes with filtering |
| GET    | `/api/genes/:symbol`                 | Get a specific gene           |
| GET    | `/api/genes/:symbol/domains`         | Get protein domains           |
| GET    | `/api/genes/region/:chr/:start-:end` | Get genes in region           |

**Query Parameters for `/api/genes`:**

- `symbol` - Filter by gene symbol (partial match)
- `chromosome` - Filter by chromosome
- `biotype` - Filter by gene biotype
- `limit` - Limit results (default: 100)
- `offset` - Pagination offset

**Examples:**

```bash
# List all genes
curl http://localhost:3001/api/genes

# Search for TP53
curl http://localhost:3001/api/genes?symbol=tp53

# Get TP53 details
curl http://localhost:3001/api/genes/TP53

# Get TP53 protein domains
curl http://localhost:3001/api/genes/TP53/domains

# Genes on chromosome 17
curl http://localhost:3001/api/genes?chromosome=chr17

# Genes in a region
curl "http://localhost:3001/api/genes/region/chr17/7668402-7687550"
```

#### Variants

| Method | Endpoint                                | Description                      |
| ------ | --------------------------------------- | -------------------------------- |
| GET    | `/api/variants`                         | List all variants with filtering |
| GET    | `/api/variants/stats`                   | Get variant statistics           |
| GET    | `/api/variants/:id`                     | Get a specific variant           |
| GET    | `/api/variants/region/:chr/:start-:end` | Get variants in region           |

**Query Parameters for `/api/variants`:**

- `gene` - Filter by gene symbol
- `chromosome` - Filter by chromosome
- `type` - Filter by variant type (missense, nonsense, frameshift)
- `significance` - Filter by clinical significance
- `minFreq` - Minimum allele frequency
- `maxFreq` - Maximum allele frequency
- `limit` - Limit results (default: 100)
- `offset` - Pagination offset

**Examples:**

```bash
# All variants
curl http://localhost:3001/api/variants

# TP53 variants only
curl http://localhost:3001/api/variants?gene=TP53

# Missense variants
curl http://localhost:3001/api/variants?type=missense

# Pathogenic variants
curl http://localhost:3001/api/variants?significance=pathogenic

# Variant statistics
curl http://localhost:3001/api/variants/stats

# Specific variant
curl http://localhost:3001/api/variants/var_001
```

#### Samples

| Method | Endpoint                    | Description                      |
| ------ | --------------------------- | -------------------------------- |
| GET    | `/api/samples`              | List all samples with filtering  |
| GET    | `/api/samples/stats`        | Get sample statistics            |
| GET    | `/api/samples/:id`          | Get a specific sample (enriched) |
| GET    | `/api/samples/:id/variants` | Get variants for a sample        |

**Query Parameters for `/api/samples`:**

- `project` - Filter by project (e.g., TCGA-BRCA)
- `cancerType` - Filter by cancer type
- `sex` - Filter by sex (Male/Female)
- `minAge` / `maxAge` - Age range filter
- `stage` - Filter by cancer stage
- `gene` - Filter samples with variants in a specific gene
- `limit` - Limit results (default: 100)
- `offset` - Pagination offset

**Examples:**

```bash
# All samples
curl http://localhost:3001/api/samples

# TCGA-BRCA samples
curl http://localhost:3001/api/samples?project=TCGA-BRCA

# Samples with TP53 mutations
curl http://localhost:3001/api/samples?gene=TP53

# Female patients
curl http://localhost:3001/api/samples?sex=Female

# Sample statistics
curl http://localhost:3001/api/samples/stats

# Specific sample with variant details
curl http://localhost:3001/api/samples/TCGA-001
```

#### Utility Endpoints

| Method | Endpoint      | Description                    |
| ------ | ------------- | ------------------------------ |
| GET    | `/api`        | API overview and documentation |
| GET    | `/api/health` | Health check endpoint          |

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 24,
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Not Found",
  "message": "No gene found with symbol: INVALID"
}
```

## Key Concepts Explained

### 1. Express.js Middleware

Middleware functions have access to `req`, `res`, and `next`:

```javascript
// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next(); // Pass to next middleware
});
```

### 2. Route Modularization

Routes are organized by resource:

```javascript
// server.js
import genesRouter from './routes/genes.js';
app.use('/api/genes', genesRouter);

// routes/genes.js
const router = express.Router();
router.get('/', (req, res) => { ... });
router.get('/:symbol', (req, res) => { ... });
export default router;
```

### 3. Query Parameter Filtering

```javascript
router.get('/', (req, res) => {
  let result = [...data];

  if (req.query.type) {
    result = result.filter((v) => v.type === req.query.type);
  }

  res.json({ success: true, data: result });
});
```

### 4. Error Handling

Centralized error handling with middleware:

```javascript
// Custom error class
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Error handler middleware
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
  });
});
```

## Exercises

### Exercise 1: Add Chromosome Endpoint

Create a new endpoint that returns all unique chromosomes in the dataset:

```
GET /api/chromosomes
```

### Exercise 2: Add Sorting

Add `sort` and `order` query parameters to the genes endpoint:

```
GET /api/genes?sort=symbol&order=asc
```

### Exercise 3: Add Search Endpoint

Create a unified search endpoint that searches across genes, variants, and samples:

```
GET /api/search?q=TP53
```

### Exercise 4: Add Rate Limiting

Implement rate limiting middleware to prevent abuse:

- 100 requests per minute per IP

## Data Model

### Gene

```javascript
{
  id: 'ENSG00000141510',
  symbol: 'TP53',
  name: 'tumor protein p53',
  chromosome: 'chr17',
  start: 7668402,
  end: 7687550,
  strand: '-',
  biotype: 'protein_coding',
  description: 'Tumor suppressor gene...'
}
```

### Variant

```javascript
{
  id: 'var_001',
  geneSymbol: 'TP53',
  chromosome: 'chr17',
  position: 7673700,
  ref: 'C',
  alt: 'T',
  type: 'missense',
  aaChange: 'R175H',
  consequence: 'missense_variant',
  clinicalSignificance: 'pathogenic',
  frequency: 0.0001
}
```

### Sample

```javascript
{
  id: 'TCGA-001',
  project: 'TCGA-BRCA',
  cancerType: 'Breast Invasive Carcinoma',
  variantIds: ['var_018', 'var_020'],
  age: 52,
  sex: 'Female',
  stage: 'II'
}
```

## 🎯 ProteinPaint Connection

ProteinPaint has a sophisticated backend architecture for serving genomic data:

| Tutorial Concept | ProteinPaint Usage                                 |
| ---------------- | -------------------------------------------------- |
| REST endpoints   | `server/src/app.js` - Express setup                |
| Route modules    | `server/src/routes/*.ts` - Endpoint organization   |
| Query handling   | `server/src/termdb.*.js` - Query parameter parsing |
| CORS middleware  | `server/src/app.js` - Cross-origin support         |
| Error handling   | Standardized error responses                       |

### ProteinPaint Server Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   ProteinPaint Server                      │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Express App (app.js)                                 │ │
│  │  ├── CORS middleware                                  │ │
│  │  ├── Body parsing (JSON)                             │ │
│  │  └── Route mounting                                   │ │
│  └──────────────────────────────────────────────────────┘ │
│                          │                                 │
│  ┌──────────────────────┴──────────────────────────────┐ │
│  │              Routes                                   │ │
│  │  /termdb      /genomes      /blocks      /mds3      │ │
│  └──────────────────────────────────────────────────────┘ │
│                          │                                 │
│  ┌──────────────────────┴──────────────────────────────┐ │
│  │              Data Layer                               │ │
│  │  SQLite DBs       File Parsers       Cache           │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Relevant ProteinPaint Files

- `server/src/app.js` - Express server configuration
- `server/src/routes/*.ts` - API route definitions
- `server/src/termdb.*.js` - Term database queries

## Exercises

### Exercise 1: Rate Limiting

Add rate limiting to prevent API abuse:

**Requirements:**

- Use express-rate-limit middleware
- 100 requests per 15 minutes per IP
- Custom error message when exceeded

### Exercise 2: API Versioning

Implement API versioning:

**Requirements:**

- Support `/api/v1/genes` and `/api/v2/genes`
- Version in URL path (not headers)
- Graceful deprecation warnings

### Exercise 3: Caching Layer

Add response caching:

**Requirements:**

- Cache gene lookups for 5 minutes
- Cache-Control headers
- ETag support for conditional requests

## Next Steps

After completing this tutorial, continue to:

- **Tutorial 2.2: PostgreSQL Database** - Replace in-memory data with a real database
- **Tutorial 2.3: File Parsing** - Parse VCF, BAM, and GFF files
- **Tutorial 2.4: R Integration** - Connect to R for statistical analysis

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## 🎯 Interview Preparation Q&A

### Q1: How would you design a REST API endpoint for genomic region queries?

**Answer:**

```
GET /api/genes/region/{chromosome}/{start}-{end}
```

**Design considerations:**

- Use path parameters for required coordinates
- Support query params for optional filters: `?biotype=protein_coding`
- Return paginated results for large regions
- Include total count in response for UI

```javascript
router.get('/region/:chr/:start-:end', async (req, res) => {
  const { chr, start, end } = req.params;
  const { biotype, limit = 100, offset = 0 } = req.query;

  // Validate coordinates
  if (end - start > 10_000_000) {
    return res.status(400).json({ error: 'Region too large (max 10Mb)' });
  }

  const genes = await queryGenesInRegion(chr, start, end, { biotype });
  res.json({
    region: { chr, start: +start, end: +end },
    total: genes.length,
    data: genes.slice(offset, offset + limit),
  });
});
```

---

### Q2: How do you handle CORS for a genomic visualization API?

**Answer:** CORS (Cross-Origin Resource Sharing) is essential when frontend and backend are on different domains:

```javascript
import cors from 'cors';

// Simple: Allow all origins (development)
app.use(cors());

// Production: Whitelist specific origins
app.use(
  cors({
    origin: ['https://viz.stjude.org', 'https://portal.stjude.cloud'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
```

**ProteinPaint context:** The embed API loads from different domains, so ProteinPaint server must return proper CORS headers.

---

### Q3: What error handling patterns would you use for a genomic API?

**Answer:**

```javascript
// Custom error class
class GenomicApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Validation errors
if (!isValidGeneSymbol(symbol)) {
  throw new GenomicApiError(400, 'Invalid gene symbol', {
    provided: symbol,
    expected: 'HGNC symbol like TP53, BRCA1',
  });
}

// Centralized error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message,
    details: err.details,
    timestamp: new Date().toISOString(),
  });
});
```

---

### Q4: How would you implement pagination for variant queries?

**Answer:**

```javascript
// Offset-based pagination
router.get('/variants', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;

  const [variants, total] = await Promise.all([
    db.query('SELECT * FROM variants LIMIT $1 OFFSET $2', [limit, offset]),
    db.query('SELECT COUNT(*) FROM variants'),
  ]);

  res.json({
    data: variants,
    pagination: {
      total: parseInt(total.rows[0].count),
      limit: +limit,
      offset: +offset,
      hasMore: offset + variants.length < total,
    },
  });
});

// Cursor-based pagination (better for large datasets)
router.get('/variants', async (req, res) => {
  const { cursor, limit = 100 } = req.query;

  const variants = await db.query('SELECT * FROM variants WHERE id > $1 ORDER BY id LIMIT $2', [
    cursor || 0,
    limit + 1,
  ]);

  const hasMore = variants.length > limit;
  res.json({
    data: variants.slice(0, limit),
    nextCursor: hasMore ? variants[limit - 1].id : null,
  });
});
```

---

### Q5: How does ProteinPaint's server architecture handle different data types?

**Answer:** ProteinPaint uses a modular route structure:

```
/termdb    - Term database queries (clinical variables)
/genomes   - Reference genome information
/mds3      - Multi-dataset version 3 (mutations, fusions, CNV)
/bigwig    - Coverage track data
/bam       - Alignment data
/vcf       - Variant call format queries
```

**Key patterns:**

1. **Route separation:** Each data type has dedicated handlers
2. **SQLite databases:** Pre-indexed for fast queries
3. **File streaming:** Large files (BAM, BigWig) streamed, not loaded
4. **Caching:** Frequently accessed data cached in memory
5. **Format conversion:** Server converts binary formats to JSON for client

---

[← Back to Tutorials Index](../../README.md)
