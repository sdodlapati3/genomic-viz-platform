[← Back to Tutorials Index](../../README.md)

---

# Tutorial 2.2: PostgreSQL Database for Genomic Data

## Overview

This tutorial builds on Tutorial 2.1 by replacing in-memory data with a PostgreSQL database. You'll learn how to design schemas for genomic data, write efficient SQL queries, and build a robust data layer.

## Learning Objectives

1. Design relational schemas for genomic data
2. Use PostgreSQL connection pools in Node.js
3. Write parameterized queries to prevent SQL injection
4. Create views and functions for complex queries
5. Handle database transactions
6. Implement proper error handling for database operations

## Prerequisites

- PostgreSQL installed and running
- Completed Tutorial 2.1

## Project Structure

```
02-postgresql/
├── package.json
├── .env                    # Database configuration
├── .env.example
├── README.md
├── start-tutorial.sh
└── src/
    ├── server.js           # Express app
    ├── db/
    │   ├── connection.js   # Connection pool
    │   ├── schema.sql      # Table definitions
    │   ├── init.js         # Schema initialization
    │   └── seed.js         # Sample data
    ├── routes/
    │   ├── genes.js
    │   ├── variants.js
    │   └── samples.js
    └── middleware/
        └── errorHandler.js
```

## Getting Started

### 1. Create the Database

```bash
# Create the database
createdb genomic_viz

# Or with psql
psql -U postgres -c "CREATE DATABASE genomic_viz"
```

### 2. Configure Environment

```bash
cd tutorials/phase-2-backend/02-postgresql

# Copy and edit .env file
cp .env.example .env

# Edit .env with your PostgreSQL credentials
```

### 3. Initialize Schema

```bash
# Install dependencies
npm install

# Create tables, views, and functions
npm run db:init

# Populate with sample data
npm run db:seed
```

### 4. Start the Server

```bash
npm run dev
```

Server runs at **http://localhost:3002**

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐
│     genes       │───┬───│ protein_domains  │
├─────────────────┤   │   ├──────────────────┤
│ id (PK)         │   │   │ id (PK)          │
│ ensembl_id      │   │   │ gene_id (FK)     │
│ symbol          │   │   │ name             │
│ name            │   │   │ start_pos        │
│ chromosome      │   │   │ end_pos          │
│ start_pos       │   │   │ description      │
│ end_pos         │   │   │ color            │
│ strand          │   │   └──────────────────┘
│ biotype         │   │
│ description     │   │   ┌──────────────────┐
└─────────────────┘   └───│    variants      │
                          ├──────────────────┤
                          │ id (PK)          │
┌─────────────────┐       │ variant_id       │
│    samples      │       │ gene_id (FK)     │
├─────────────────┤       │ chromosome       │
│ id (PK)         │       │ position         │
│ sample_id       │       │ ref_allele       │
│ project         │       │ alt_allele       │
│ cancer_type     │       │ variant_type     │
│ age             │       │ aa_change        │
│ sex             │       │ consequence      │
│ stage           │       │ clinical_sig     │
│ primary_site    │       │ allele_frequency │
└────────┬────────┘       └────────┬─────────┘
         │                         │
         │  ┌──────────────────┐   │
         └──│ sample_variants  │───┘
            ├──────────────────┤
            │ id (PK)          │
            │ sample_id (FK)   │
            │ variant_id (FK)  │
            │ vaf              │
            │ depth            │
            └──────────────────┘
```

### Tables

| Table             | Description                      |
| ----------------- | -------------------------------- |
| `genes`           | Reference gene annotations       |
| `protein_domains` | Protein domain regions per gene  |
| `variants`        | Genomic variants/mutations       |
| `samples`         | Patient/sample metadata          |
| `sample_variants` | Many-to-many: samples ↔ variants |

### Views

| View                      | Description                      |
| ------------------------- | -------------------------------- |
| `variants_with_genes`     | Variants joined with gene info   |
| `sample_mutation_summary` | Sample stats with variant counts |
| `gene_mutation_frequency` | Gene-level mutation statistics   |

### Functions

```sql
-- Get variants in a genomic region
SELECT * FROM get_variants_in_region('chr17', 7668000, 7690000);

-- Get mutation statistics for a gene
SELECT * FROM get_gene_mutation_stats('TP53');
```

## API Endpoints

Same as Tutorial 2.1, but with database-backed queries:

### Genes

- `GET /api/genes` - List genes (with filtering)
- `GET /api/genes/:symbol` - Get gene details
- `GET /api/genes/:symbol/domains` - Get protein domains
- `GET /api/genes/:symbol/variants` - Get gene variants
- `GET /api/genes/region/:chr/:start-:end` - Regional query

### Variants

- `GET /api/variants` - List variants (with filtering)
- `GET /api/variants/stats` - Aggregated statistics
- `GET /api/variants/:id` - Get variant with samples
- `GET /api/variants/region/:chr/:start-:end` - Regional query

### Samples

- `GET /api/samples` - List samples (with filtering)
- `GET /api/samples/stats` - Aggregated statistics
- `GET /api/samples/:id` - Get sample with variants
- `GET /api/samples/:id/variants` - List sample variants

## Key Concepts

### 1. Connection Pool

```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  max: 20, // Max connections
  idleTimeoutMillis: 30000, // Close idle after 30s
});

// Use pool.query() for automatic connection management
const result = await pool.query('SELECT * FROM genes');
```

### 2. Parameterized Queries (Prevent SQL Injection)

```javascript
// ❌ NEVER do this - SQL injection vulnerability
const sql = `SELECT * FROM genes WHERE symbol = '${userInput}'`;

// ✅ Always use parameterized queries
const result = await query('SELECT * FROM genes WHERE symbol = $1', [userInput]);
```

### 3. Transactions

```javascript
import { transaction } from './db/connection.js';

await transaction(async (client) => {
  await client.query('INSERT INTO genes ...', [...]);
  await client.query('INSERT INTO variants ...', [...]);
  // If any query fails, all changes are rolled back
});
```

### 4. Dynamic Query Building

```javascript
let sql = 'SELECT * FROM variants WHERE 1=1';
const params = [];
let paramIndex = 1;

if (gene) {
  sql += ` AND gene_symbol = $${paramIndex}`;
  params.push(gene);
  paramIndex++;
}

if (type) {
  sql += ` AND variant_type = $${paramIndex}`;
  params.push(type);
  paramIndex++;
}

const result = await query(sql, params);
```

### 5. Efficient Pagination

```javascript
// Get total count and paginated results
const countResult = await query('SELECT COUNT(*) FROM variants');
const total = parseInt(countResult.rows[0].count);

const result = await query('SELECT * FROM variants ORDER BY position LIMIT $1 OFFSET $2', [
  limit,
  offset,
]);
```

## Exercises

### Exercise 1: Full-Text Search

Add full-text search for gene descriptions:

```sql
-- Add search column
ALTER TABLE genes ADD COLUMN search_vector tsvector;
UPDATE genes SET search_vector = to_tsvector(name || ' ' || description);
CREATE INDEX idx_genes_search ON genes USING gin(search_vector);

-- Query
SELECT * FROM genes WHERE search_vector @@ to_tsquery('cancer & tumor');
```

### Exercise 2: Add Indexes

Create indexes to optimize common queries:

```sql
CREATE INDEX idx_variants_freq ON variants(allele_frequency);
CREATE INDEX idx_samples_age ON samples(age);
```

### Exercise 3: Batch Insert

Implement efficient bulk insert for large datasets:

```javascript
const values = variants.map((v) => `('${v.id}', '${v.chromosome}', ${v.position})`).join(',');

await query(`INSERT INTO variants (id, chromosome, position) VALUES ${values}`);
```

### Exercise 4: Data Export

Add endpoint to export query results as CSV:

```javascript
router.get('/export/csv', async (req, res) => {
  const result = await query('SELECT * FROM variants_with_genes');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=variants.csv');
  // Convert rows to CSV...
});
```

## Comparison: In-Memory vs PostgreSQL

| Aspect            | In-Memory (2.1)    | PostgreSQL (2.2)         |
| ----------------- | ------------------ | ------------------------ |
| Data persistence  | ❌ Lost on restart | ✅ Persisted             |
| Scalability       | Limited by RAM     | Handles millions of rows |
| Query complexity  | Manual filtering   | SQL joins, aggregations  |
| Concurrent access | Race conditions    | ACID transactions        |
| Search            | Linear scan        | Indexed queries          |

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql

# Start PostgreSQL (Linux)
sudo systemctl start postgresql
```

### Authentication Failed

```bash
# Check your .env credentials match PostgreSQL
psql -U postgres -d genomic_viz

# Reset password if needed
ALTER USER postgres PASSWORD 'newpassword';
```

### Database Does Not Exist

```bash
createdb genomic_viz
npm run db:init
npm run db:seed
```

## 🎯 ProteinPaint Connection

ProteinPaint uses SQLite databases extensively for genomic data storage:

| Tutorial Concept     | ProteinPaint Usage                             |
| -------------------- | ---------------------------------------------- |
| Schema design        | `server/src/termdb.sql` - Term database schema |
| Indexed queries      | `server/src/mds3.gdc.js` - GDC data queries    |
| Connection pooling   | Shared database connections                    |
| Transaction handling | Bulk data operations                           |
| Query optimization   | Prepared statements throughout                 |

### ProteinPaint Database Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  ProteinPaint Database Layer                                │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                │
│  │  termdb.sql     │  │  genome DBs      │                │
│  │  ├── terms      │  │  ├── genes       │                │
│  │  ├── samples    │  │  ├── variants    │                │
│  │  ├── annotations│  │  └── features    │                │
│  │  └── relations  │  └──────────────────┘                │
│  └─────────────────┘                                       │
│           │                      │                          │
│  ┌────────┴──────────────────────┴─────────────────────┐  │
│  │              Query Layer                              │  │
│  │  better-sqlite3 (sync, fast)                         │  │
│  │  Prepared statements cached                          │  │
│  │  Indexes on chr, start, end, gene                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Relevant ProteinPaint Files

- `server/src/termdb.sql` - Database schema definitions
- `server/src/termdb.*.js` - Database query modules
- `server/src/mds3.init.js` - Database initialization

## Exercises

### Exercise 1: Genomic Range Index

Create optimized indexes for range queries:

**Requirements:**

- Composite index on (chromosome, start, end)
- Query variants in a chromosomal region
- Benchmark query performance

### Exercise 2: Materialized Views

Create views for common query patterns:

**Requirements:**

- View for gene summary statistics
- View for variant counts by type
- Refresh strategy for views

### Exercise 3: Full-Text Search

Add full-text search for gene descriptions:

**Requirements:**

- Create GIN index on description
- Search by keywords
- Rank results by relevance

## Next Steps

- **Tutorial 2.3: File Parsing** - Parse VCF, BAM, and GFF files
- **Tutorial 2.4: R Integration** - Connect to R for statistical analysis

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg)](https://node-postgres.com/)
- [SQL Style Guide](https://www.sqlstyle.guide/)
- [Database Indexing](https://use-the-index-luke.com/)

---

## 🎯 Interview Preparation Q&A

### Q1: Why use PostgreSQL vs SQLite for genomic data?

**Answer:**
| Feature | PostgreSQL | SQLite |
|---------|-----------|--------|
| Concurrency | Full MVCC, many writers | Single writer, readers block |
| Scale | Millions of rows, TB scale | Best under 100GB |
| JSON support | Native JSONB with indexing | Basic JSON, no index |
| Full-text search | Built-in tsvector | Requires extension |
| Network access | Client-server model | File-based, embed only |

**ProteinPaint choice:** Uses SQLite for pre-built dataset databases (shipped with data), PostgreSQL for dynamic/user data.

**Use PostgreSQL when:**

- Multiple concurrent users
- Complex queries with joins
- Need transactions for data integrity
- JSON data with querying needs

---

### Q2: How would you design a schema for mutation data?

**Answer:**

```sql
CREATE TABLE genes (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(50) UNIQUE NOT NULL,
    ensembl_id VARCHAR(20),
    chromosome VARCHAR(5),
    start_pos INTEGER,
    end_pos INTEGER,
    strand CHAR(1)
);

CREATE TABLE variants (
    id SERIAL PRIMARY KEY,
    variant_id VARCHAR(50) UNIQUE,  -- rs123, COSM123
    gene_id INTEGER REFERENCES genes(id),
    chromosome VARCHAR(5) NOT NULL,
    position INTEGER NOT NULL,
    ref_allele VARCHAR(1000),
    alt_allele VARCHAR(1000),
    consequence VARCHAR(50),       -- missense, nonsense
    aa_change VARCHAR(50),         -- R175H
    clinical_significance VARCHAR(50)
);

CREATE TABLE sample_variants (
    sample_id INTEGER REFERENCES samples(id),
    variant_id INTEGER REFERENCES variants(id),
    vaf DECIMAL(5,4),              -- Variant allele frequency
    depth INTEGER,
    PRIMARY KEY (sample_id, variant_id)
);

-- Essential indexes for genomic queries
CREATE INDEX idx_variants_region ON variants(chromosome, position);
CREATE INDEX idx_variants_gene ON variants(gene_id);
CREATE INDEX idx_variants_consequence ON variants(consequence);
```

---

### Q3: Explain SQL injection prevention in genomic queries.

**Answer:**

```javascript
// ❌ DANGEROUS - SQL injection vulnerable
const query = `SELECT * FROM genes WHERE symbol = '${userInput}'`;
// User could input: '; DROP TABLE genes; --

// ✅ SAFE - Parameterized query
const result = await pool.query('SELECT * FROM genes WHERE symbol = $1', [userInput]);

// ✅ SAFE - Dynamic query building
function buildVariantQuery(filters) {
  let sql = 'SELECT * FROM variants WHERE 1=1';
  const params = [];
  let i = 1;

  if (filters.gene) {
    sql += ` AND gene_symbol = $${i++}`;
    params.push(filters.gene);
  }
  if (filters.chromosome) {
    sql += ` AND chromosome = $${i++}`;
    params.push(filters.chromosome);
  }

  return { sql, params };
}
```

---

### Q4: How would you optimize a query for variants in a genomic region?

**Answer:**

```sql
-- 1. Create composite index on (chromosome, position)
CREATE INDEX idx_variants_region
ON variants(chromosome, position);

-- 2. Use BETWEEN for range queries
SELECT * FROM variants
WHERE chromosome = 'chr17'
  AND position BETWEEN 7668402 AND 7687550;

-- 3. For very large tables, use partial index
CREATE INDEX idx_chr17_variants
ON variants(position)
WHERE chromosome = 'chr17';

-- 4. Consider table partitioning by chromosome
CREATE TABLE variants (
    ...
) PARTITION BY LIST (chromosome);

CREATE TABLE variants_chr17 PARTITION OF variants
    FOR VALUES IN ('chr17');
```

**Query plan analysis:**

```sql
EXPLAIN ANALYZE
SELECT * FROM variants
WHERE chromosome = 'chr17' AND position BETWEEN 7668402 AND 7687550;
-- Should show "Index Scan" not "Seq Scan"
```

---

### Q5: How do you handle database transactions for genomic data imports?

**Answer:**

```javascript
async function importVcfToDatabase(variants) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Batch insert with ON CONFLICT for upserts
    const insertQuery = `
      INSERT INTO variants (variant_id, chromosome, position, ref, alt)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (variant_id) DO UPDATE 
      SET position = EXCLUDED.position
      RETURNING id
    `;

    for (const variant of variants) {
      await client.query(insertQuery, [
        variant.id,
        variant.chr,
        variant.pos,
        variant.ref,
        variant.alt,
      ]);
    }

    await client.query('COMMIT');
    console.log(`Imported ${variants.length} variants`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

**Best practices:**

- Use transactions for multi-table inserts
- Batch inserts (100-1000 rows per statement)
- Disable indexes during bulk load, rebuild after
- Use COPY command for very large imports

---

[← Back to Tutorials Index](../../README.md)
