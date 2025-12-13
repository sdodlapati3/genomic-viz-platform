/**
 * Genomic Types
 * Core type definitions for genomic data structures
 */

// =============================================================================
// Gene & Transcript Types
// =============================================================================

export interface Gene {
  /** Official gene symbol (e.g., "TP53", "EGFR") */
  symbol: string;
  /** Entrez Gene ID */
  entrezId?: number;
  /** Ensembl Gene ID */
  ensemblId?: string;
  /** Full gene name */
  name: string;
  /** Chromosome (e.g., "chr17", "chrX") */
  chromosome: string;
  /** Start position (1-based) */
  start: number;
  /** End position (1-based, inclusive) */
  end: number;
  /** Strand orientation */
  strand: '+' | '-';
  /** Gene biotype */
  biotype?: 'protein_coding' | 'lncRNA' | 'miRNA' | 'pseudogene' | string;
  /** Associated transcripts */
  transcripts?: Transcript[];
}

export interface Transcript {
  /** Transcript ID (e.g., "ENST00000269305") */
  transcriptId: string;
  /** Gene symbol this transcript belongs to */
  geneSymbol: string;
  /** Is this the canonical transcript? */
  isCanonical: boolean;
  /** Transcript start position */
  start: number;
  /** Transcript end position */
  end: number;
  /** Exon coordinates */
  exons: Exon[];
  /** Coding sequence region */
  cds?: CodingSequence;
  /** Protein product */
  protein?: Protein;
}

export interface Exon {
  /** Exon number (1-based) */
  exonNumber: number;
  /** Start position */
  start: number;
  /** End position */
  end: number;
  /** Is coding? */
  isCoding: boolean;
}

export interface CodingSequence {
  /** CDS start position */
  start: number;
  /** CDS end position */
  end: number;
  /** Coding exon ranges */
  codingExons: Array<{ start: number; end: number }>;
}

export interface Protein {
  /** Protein accession (e.g., "P04637") */
  accession: string;
  /** Protein name */
  name: string;
  /** Length in amino acids */
  length: number;
  /** Protein domains */
  domains: ProteinDomain[];
}

export interface ProteinDomain {
  /** Domain name */
  name: string;
  /** Domain type/source (e.g., "Pfam", "SMART") */
  source: string;
  /** Start amino acid position */
  start: number;
  /** End amino acid position */
  end: number;
  /** Domain description */
  description?: string;
  /** Display color (hex) */
  color?: string;
}

// =============================================================================
// Variant Types
// =============================================================================

export interface Variant {
  /** Unique variant identifier */
  id: string;
  /** Chromosome */
  chromosome: string;
  /** Position (1-based) */
  position: number;
  /** Reference allele */
  ref: string;
  /** Alternate allele */
  alt: string;
  /** Variant type */
  type: VariantType;
  /** Quality score */
  quality?: number;
  /** Filter status */
  filter?: 'PASS' | string;
  /** Additional annotations */
  annotations?: VariantAnnotation;
}

export type VariantType = 
  | 'SNV'           // Single nucleotide variant
  | 'DNV'           // Di-nucleotide variant
  | 'TNV'           // Tri-nucleotide variant
  | 'ONV'           // Oligo-nucleotide variant
  | 'INS'           // Insertion
  | 'DEL'           // Deletion
  | 'INDEL'         // Insertion/Deletion
  | 'SV'            // Structural variant
  | 'CNV';          // Copy number variant

export interface VariantAnnotation {
  /** Gene affected */
  gene?: string;
  /** Transcript affected */
  transcript?: string;
  /** Consequence type */
  consequence?: VariantConsequence;
  /** HGVS coding notation */
  hgvsc?: string;
  /** HGVS protein notation */
  hgvsp?: string;
  /** Amino acid change (e.g., "R175H") */
  aaChange?: string;
  /** Codon change */
  codonChange?: string;
  /** Protein position */
  proteinPosition?: number;
  /** SIFT prediction */
  sift?: { prediction: string; score: number };
  /** PolyPhen prediction */
  polyphen?: { prediction: string; score: number };
  /** Population frequencies */
  frequencies?: PopulationFrequency;
  /** Clinical significance */
  clinicalSignificance?: ClinicalSignificance;
}

export type VariantConsequence =
  | 'missense_variant'
  | 'nonsense_variant'
  | 'synonymous_variant'
  | 'frameshift_variant'
  | 'inframe_insertion'
  | 'inframe_deletion'
  | 'splice_acceptor_variant'
  | 'splice_donor_variant'
  | 'splice_region_variant'
  | 'start_lost'
  | 'stop_lost'
  | 'stop_retained_variant'
  | '5_prime_UTR_variant'
  | '3_prime_UTR_variant'
  | 'intron_variant'
  | 'intergenic_variant'
  | 'regulatory_region_variant';

export interface PopulationFrequency {
  /** gnomAD all populations */
  gnomadAll?: number;
  /** 1000 Genomes all populations */
  thousandGenomes?: number;
  /** Population-specific frequencies */
  populations?: Record<string, number>;
}

export type ClinicalSignificance =
  | 'pathogenic'
  | 'likely_pathogenic'
  | 'uncertain_significance'
  | 'likely_benign'
  | 'benign'
  | 'conflicting_interpretations';

// =============================================================================
// Mutation Types (for cancer genomics)
// =============================================================================

export interface Mutation extends Variant {
  /** Sample ID */
  sampleId: string;
  /** Mutation class */
  mutationClass: MutationClass;
  /** Variant allele frequency */
  vaf?: number;
  /** Read depth at position */
  depth?: number;
  /** Alternate allele read count */
  altCount?: number;
  /** Reference allele read count */
  refCount?: number;
  /** Is somatic? */
  isSomatic: boolean;
  /** Mutation status */
  status?: 'somatic' | 'germline' | 'LOH' | 'unknown';
}

export type MutationClass =
  | 'missense'
  | 'nonsense'
  | 'frameshift'
  | 'splice'
  | 'silent'
  | 'inframe_indel'
  | 'other';

// =============================================================================
// Genomic Region Types
// =============================================================================

export interface GenomicRegion {
  /** Chromosome */
  chromosome: string;
  /** Start position (1-based) */
  start: number;
  /** End position (1-based, inclusive) */
  end: number;
  /** Strand (optional) */
  strand?: '+' | '-';
}

export interface GenomicRange extends GenomicRegion {
  /** Region name/label */
  name?: string;
  /** Score (0-1000 for BED format) */
  score?: number;
  /** Display color */
  color?: string;
}

// =============================================================================
// Coordinate System Helpers
// =============================================================================

export interface CoordinateSystem {
  /** Coordinate system name */
  name: '0-based' | '1-based';
  /** Is start inclusive? */
  startInclusive: boolean;
  /** Is end inclusive? */
  endInclusive: boolean;
}

export const COORDINATE_SYSTEMS: Record<string, CoordinateSystem> = {
  BED: { name: '0-based', startInclusive: true, endInclusive: false },
  VCF: { name: '1-based', startInclusive: true, endInclusive: true },
  GFF: { name: '1-based', startInclusive: true, endInclusive: true },
};

// =============================================================================
// Reference Genome
// =============================================================================

export interface ReferenceGenome {
  /** Genome build name */
  name: 'hg19' | 'hg38' | 'GRCh37' | 'GRCh38';
  /** Chromosome sizes */
  chromosomes: ChromosomeInfo[];
  /** Total genome size */
  totalSize: number;
}

export interface ChromosomeInfo {
  /** Chromosome name (e.g., "chr1", "1") */
  name: string;
  /** Chromosome length in base pairs */
  length: number;
  /** Centromere position (if known) */
  centromere?: { start: number; end: number };
}
