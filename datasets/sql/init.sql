-- Genomic Visualization Platform - Database Schema
-- PostgreSQL 15+

-- =============================================================================
-- Extensions
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- =============================================================================
-- Genes Table
-- =============================================================================

CREATE TABLE genes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(500),
    ensembl_id VARCHAR(50),
    entrez_id INTEGER,
    chromosome VARCHAR(10) NOT NULL,
    start_pos BIGINT NOT NULL,
    end_pos BIGINT NOT NULL,
    strand CHAR(1) CHECK (strand IN ('+', '-')),
    biotype VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_genes_symbol ON genes(symbol);
CREATE INDEX idx_genes_chromosome ON genes(chromosome);
CREATE INDEX idx_genes_position ON genes(chromosome, start_pos, end_pos);
CREATE INDEX idx_genes_symbol_trgm ON genes USING gin(symbol gin_trgm_ops);

-- =============================================================================
-- Transcripts Table
-- =============================================================================

CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcript_id VARCHAR(50) NOT NULL UNIQUE,
    gene_id UUID REFERENCES genes(id) ON DELETE CASCADE,
    is_canonical BOOLEAN DEFAULT FALSE,
    start_pos BIGINT NOT NULL,
    end_pos BIGINT NOT NULL,
    cds_start BIGINT,
    cds_end BIGINT,
    exons JSONB,  -- Array of {start, end, is_coding}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transcripts_gene_id ON transcripts(gene_id);
CREATE INDEX idx_transcripts_canonical ON transcripts(gene_id, is_canonical) WHERE is_canonical = TRUE;

-- =============================================================================
-- Protein Domains Table
-- =============================================================================

CREATE TABLE protein_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gene_id UUID REFERENCES genes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    source VARCHAR(50),  -- Pfam, SMART, etc.
    start_pos INTEGER NOT NULL,
    end_pos INTEGER NOT NULL,
    description TEXT,
    color VARCHAR(7),  -- Hex color
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_protein_domains_gene_id ON protein_domains(gene_id);

-- =============================================================================
-- Samples Table
-- =============================================================================

CREATE TABLE samples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id VARCHAR(100) NOT NULL UNIQUE,
    patient_id VARCHAR(100),
    sample_type VARCHAR(50),
    tissue VARCHAR(100),
    is_tumor BOOLEAN DEFAULT TRUE,
    disease VARCHAR(200),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_samples_sample_id ON samples(sample_id);
CREATE INDEX idx_samples_patient_id ON samples(patient_id);
CREATE INDEX idx_samples_disease ON samples(disease);

-- =============================================================================
-- Variants Table
-- =============================================================================

CREATE TABLE variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chromosome VARCHAR(10) NOT NULL,
    position BIGINT NOT NULL,
    ref_allele VARCHAR(1000) NOT NULL,
    alt_allele VARCHAR(1000) NOT NULL,
    variant_type VARCHAR(20),
    gene_id UUID REFERENCES genes(id),
    transcript_id VARCHAR(50),
    consequence VARCHAR(100),
    hgvsc VARCHAR(200),
    hgvsp VARCHAR(200),
    protein_position INTEGER,
    aa_change VARCHAR(50),
    annotations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chromosome, position, ref_allele, alt_allele)
);

CREATE INDEX idx_variants_position ON variants(chromosome, position);
CREATE INDEX idx_variants_gene_id ON variants(gene_id);
CREATE INDEX idx_variants_consequence ON variants(consequence);
CREATE INDEX idx_variants_protein_pos ON variants(gene_id, protein_position);

-- =============================================================================
-- Sample Variants (Junction Table)
-- =============================================================================

CREATE TABLE sample_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
    vaf DECIMAL(5, 4),  -- Variant allele frequency
    depth INTEGER,
    alt_count INTEGER,
    ref_count INTEGER,
    is_somatic BOOLEAN DEFAULT TRUE,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sample_id, variant_id)
);

CREATE INDEX idx_sample_variants_sample ON sample_variants(sample_id);
CREATE INDEX idx_sample_variants_variant ON sample_variants(variant_id);

-- =============================================================================
-- Clinical Data Table
-- =============================================================================

CREATE TABLE clinical_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID REFERENCES samples(id) ON DELETE CASCADE UNIQUE,
    age_at_diagnosis INTEGER,
    sex VARCHAR(20),
    race VARCHAR(100),
    ethnicity VARCHAR(100),
    stage VARCHAR(20),
    grade VARCHAR(20),
    vital_status VARCHAR(20),
    survival_time INTEGER,  -- Days
    survival_event BOOLEAN,
    treatment_group VARCHAR(100),
    additional_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clinical_sample ON clinical_data(sample_id);
CREATE INDEX idx_clinical_survival ON clinical_data(survival_time, survival_event);

-- =============================================================================
-- Expression Data Table
-- =============================================================================

CREATE TABLE expression_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
    gene_id UUID REFERENCES genes(id) ON DELETE CASCADE,
    value DECIMAL(10, 4) NOT NULL,
    value_type VARCHAR(20) DEFAULT 'tpm',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sample_id, gene_id, value_type)
);

CREATE INDEX idx_expression_sample ON expression_data(sample_id);
CREATE INDEX idx_expression_gene ON expression_data(gene_id);

-- =============================================================================
-- Cohorts Table
-- =============================================================================

CREATE TABLE cohorts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sample_count INTEGER DEFAULT 0,
    filter_criteria JSONB,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cohort_samples (
    cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,
    sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
    PRIMARY KEY (cohort_id, sample_id)
);

-- =============================================================================
-- Useful Views
-- =============================================================================

-- View: Mutation summary per gene
CREATE VIEW gene_mutation_summary AS
SELECT 
    g.symbol,
    g.name,
    COUNT(DISTINCT v.id) as variant_count,
    COUNT(DISTINCT sv.sample_id) as sample_count,
    COUNT(DISTINCT CASE WHEN v.consequence = 'missense_variant' THEN v.id END) as missense_count,
    COUNT(DISTINCT CASE WHEN v.consequence = 'stop_gained' THEN v.id END) as nonsense_count,
    COUNT(DISTINCT CASE WHEN v.consequence = 'frameshift_variant' THEN v.id END) as frameshift_count
FROM genes g
LEFT JOIN variants v ON g.id = v.gene_id
LEFT JOIN sample_variants sv ON v.id = sv.variant_id
GROUP BY g.id, g.symbol, g.name;

-- View: Sample summary
CREATE VIEW sample_summary AS
SELECT 
    s.sample_id,
    s.disease,
    s.tissue,
    cd.age_at_diagnosis,
    cd.sex,
    cd.stage,
    cd.survival_time,
    cd.survival_event,
    COUNT(sv.id) as mutation_count
FROM samples s
LEFT JOIN clinical_data cd ON s.id = cd.sample_id
LEFT JOIN sample_variants sv ON s.id = sv.sample_id
GROUP BY s.id, s.sample_id, s.disease, s.tissue, 
         cd.age_at_diagnosis, cd.sex, cd.stage, 
         cd.survival_time, cd.survival_event;

-- =============================================================================
-- Functions
-- =============================================================================

-- Function: Get variants in genomic region
CREATE OR REPLACE FUNCTION get_variants_in_region(
    p_chromosome VARCHAR,
    p_start BIGINT,
    p_end BIGINT
)
RETURNS TABLE (
    variant_id UUID,
    chromosome VARCHAR,
    position BIGINT,
    ref_allele VARCHAR,
    alt_allele VARCHAR,
    gene_symbol VARCHAR,
    consequence VARCHAR,
    sample_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.chromosome,
        v.position,
        v.ref_allele,
        v.alt_allele,
        g.symbol,
        v.consequence,
        COUNT(DISTINCT sv.sample_id)
    FROM variants v
    LEFT JOIN genes g ON v.gene_id = g.id
    LEFT JOIN sample_variants sv ON v.id = sv.variant_id
    WHERE v.chromosome = p_chromosome
      AND v.position >= p_start
      AND v.position <= p_end
    GROUP BY v.id, g.symbol
    ORDER BY v.position;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Seed Data Trigger (update timestamps)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER genes_updated_at BEFORE UPDATE ON genes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER samples_updated_at BEFORE UPDATE ON samples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER clinical_data_updated_at BEFORE UPDATE ON clinical_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER cohorts_updated_at BEFORE UPDATE ON cohorts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
