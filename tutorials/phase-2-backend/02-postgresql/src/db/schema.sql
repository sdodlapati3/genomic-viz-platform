-- ============================================================================
-- Genomic Visualization Platform - Database Schema
-- Tutorial 2.2: PostgreSQL for Genomic Data
-- ============================================================================

-- Drop tables if they exist (for clean re-initialization)
DROP TABLE IF EXISTS sample_variants CASCADE;
DROP TABLE IF EXISTS variants CASCADE;
DROP TABLE IF EXISTS protein_domains CASCADE;
DROP TABLE IF EXISTS samples CASCADE;
DROP TABLE IF EXISTS genes CASCADE;

-- ============================================================================
-- GENES TABLE
-- Stores gene information from reference annotations
-- ============================================================================
CREATE TABLE genes (
    id SERIAL PRIMARY KEY,
    ensembl_id VARCHAR(20) UNIQUE NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    chromosome VARCHAR(10) NOT NULL,
    start_pos INTEGER NOT NULL,
    end_pos INTEGER NOT NULL,
    strand CHAR(1) CHECK (strand IN ('+', '-')),
    biotype VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_genes_symbol ON genes(symbol);
CREATE INDEX idx_genes_chromosome ON genes(chromosome);
CREATE INDEX idx_genes_position ON genes(chromosome, start_pos, end_pos);

-- ============================================================================
-- PROTEIN_DOMAINS TABLE
-- Stores protein domain annotations for genes
-- ============================================================================
CREATE TABLE protein_domains (
    id SERIAL PRIMARY KEY,
    gene_id INTEGER REFERENCES genes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_pos INTEGER NOT NULL,
    end_pos INTEGER NOT NULL,
    description TEXT,
    pfam_id VARCHAR(20),
    color VARCHAR(7) -- hex color for visualization
);

CREATE INDEX idx_domains_gene ON protein_domains(gene_id);

-- ============================================================================
-- VARIANTS TABLE
-- Stores genomic variants/mutations
-- ============================================================================
CREATE TABLE variants (
    id SERIAL PRIMARY KEY,
    variant_id VARCHAR(50) UNIQUE NOT NULL,
    gene_id INTEGER REFERENCES genes(id) ON DELETE SET NULL,
    chromosome VARCHAR(10) NOT NULL,
    position INTEGER NOT NULL,
    ref_allele VARCHAR(500) NOT NULL,
    alt_allele VARCHAR(500) NOT NULL,
    variant_type VARCHAR(50) NOT NULL,
    aa_change VARCHAR(50),
    consequence VARCHAR(100),
    clinical_significance VARCHAR(50),
    allele_frequency DECIMAL(10, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for variant queries
CREATE INDEX idx_variants_gene ON variants(gene_id);
CREATE INDEX idx_variants_chromosome ON variants(chromosome);
CREATE INDEX idx_variants_position ON variants(chromosome, position);
CREATE INDEX idx_variants_type ON variants(variant_type);
CREATE INDEX idx_variants_significance ON variants(clinical_significance);

-- ============================================================================
-- SAMPLES TABLE
-- Stores patient/sample information
-- ============================================================================
CREATE TABLE samples (
    id SERIAL PRIMARY KEY,
    sample_id VARCHAR(50) UNIQUE NOT NULL,
    project VARCHAR(50),
    cancer_type VARCHAR(100),
    age INTEGER CHECK (age >= 0 AND age <= 150),
    sex VARCHAR(10) CHECK (sex IN ('Male', 'Female', 'Unknown')),
    stage VARCHAR(10),
    primary_site VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_samples_project ON samples(project);
CREATE INDEX idx_samples_cancer_type ON samples(cancer_type);

-- ============================================================================
-- SAMPLE_VARIANTS TABLE
-- Junction table for many-to-many relationship between samples and variants
-- ============================================================================
CREATE TABLE sample_variants (
    id SERIAL PRIMARY KEY,
    sample_id INTEGER REFERENCES samples(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES variants(id) ON DELETE CASCADE,
    vaf DECIMAL(5, 4), -- Variant allele frequency in this sample
    depth INTEGER,      -- Read depth
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sample_id, variant_id)
);

CREATE INDEX idx_sample_variants_sample ON sample_variants(sample_id);
CREATE INDEX idx_sample_variants_variant ON sample_variants(variant_id);

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- View: Variants with gene information
CREATE OR REPLACE VIEW variants_with_genes AS
SELECT 
    v.id,
    v.variant_id,
    v.chromosome,
    v.position,
    v.ref_allele,
    v.alt_allele,
    v.variant_type,
    v.aa_change,
    v.consequence,
    v.clinical_significance,
    v.allele_frequency,
    g.symbol AS gene_symbol,
    g.name AS gene_name
FROM variants v
LEFT JOIN genes g ON v.gene_id = g.id;

-- View: Sample mutation summary
CREATE OR REPLACE VIEW sample_mutation_summary AS
SELECT 
    s.sample_id,
    s.project,
    s.cancer_type,
    COUNT(DISTINCT sv.variant_id) AS variant_count,
    COUNT(DISTINCT v.gene_id) AS affected_genes
FROM samples s
LEFT JOIN sample_variants sv ON s.id = sv.sample_id
LEFT JOIN variants v ON sv.variant_id = v.id
GROUP BY s.id, s.sample_id, s.project, s.cancer_type;

-- View: Gene mutation frequency
CREATE OR REPLACE VIEW gene_mutation_frequency AS
SELECT 
    g.symbol,
    g.name,
    COUNT(DISTINCT v.id) AS variant_count,
    COUNT(DISTINCT sv.sample_id) AS sample_count
FROM genes g
LEFT JOIN variants v ON g.id = v.gene_id
LEFT JOIN sample_variants sv ON v.id = sv.variant_id
GROUP BY g.id, g.symbol, g.name
ORDER BY sample_count DESC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get variants in a genomic region
CREATE OR REPLACE FUNCTION get_variants_in_region(
    p_chromosome VARCHAR,
    p_start INTEGER,
    p_end INTEGER
)
RETURNS TABLE (
    variant_id VARCHAR,
    position INTEGER,
    ref_allele VARCHAR,
    alt_allele VARCHAR,
    variant_type VARCHAR,
    gene_symbol VARCHAR,
    aa_change VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.variant_id,
        v.position,
        v.ref_allele,
        v.alt_allele,
        v.variant_type,
        g.symbol,
        v.aa_change
    FROM variants v
    LEFT JOIN genes g ON v.gene_id = g.id
    WHERE v.chromosome = p_chromosome
      AND v.position >= p_start
      AND v.position <= p_end
    ORDER BY v.position;
END;
$$ LANGUAGE plpgsql;

-- Function: Get mutation statistics for a gene
CREATE OR REPLACE FUNCTION get_gene_mutation_stats(p_symbol VARCHAR)
RETURNS TABLE (
    variant_type VARCHAR,
    count BIGINT,
    avg_frequency NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.variant_type,
        COUNT(*),
        AVG(v.allele_frequency)::NUMERIC(10,8)
    FROM variants v
    JOIN genes g ON v.gene_id = g.id
    WHERE g.symbol = p_symbol
    GROUP BY v.variant_type
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;
