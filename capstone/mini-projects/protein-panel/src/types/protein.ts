/**
 * Protein Types
 *
 * Type definitions for protein structures, domains, and annotations
 */

/**
 * Represents a protein with its basic properties
 */
export interface Protein {
  /** Unique identifier */
  id: string;
  /** Gene symbol (e.g., "TP53") */
  symbol: string;
  /** Full protein name */
  name: string;
  /** Length in amino acids */
  length: number;
  /** UniProt accession (optional) */
  uniprot?: string;
  /** RefSeq protein ID (optional) */
  refseq?: string;
  /** Alternative names/aliases */
  aliases?: string[];
}

/**
 * Domain database source types
 */
export type DomainSource = 'pfam' | 'smart' | 'interpro' | 'prosite' | 'custom';

/**
 * Represents a functional protein domain
 */
export interface ProteinDomain {
  /** Unique identifier */
  id: string;
  /** Domain name (e.g., "DNA-binding domain") */
  name: string;
  /** Short name/abbreviation */
  shortName?: string;
  /** Source database */
  source: DomainSource;
  /** Start position (1-based, inclusive) */
  start: number;
  /** End position (1-based, inclusive) */
  end: number;
  /** Display color (hex or CSS color) */
  color: string;
  /** Detailed description */
  description?: string;
  /** External database ID (e.g., PF00870) */
  externalId?: string;
}

/**
 * Region of interest (not a functional domain)
 */
export interface ProteinRegion {
  /** Unique identifier */
  id: string;
  /** Region name */
  name: string;
  /** Start position (1-based) */
  start: number;
  /** End position (1-based) */
  end: number;
  /** Region type */
  type:
    | 'signal_peptide'
    | 'transmembrane'
    | 'low_complexity'
    | 'coiled_coil'
    | 'disordered'
    | 'other';
  /** Display color */
  color?: string;
}

/**
 * Post-translational modification site
 */
export interface PTMSite {
  /** Position (1-based) */
  position: number;
  /** Amino acid at this position */
  residue: string;
  /** Type of modification */
  type:
    | 'phosphorylation'
    | 'acetylation'
    | 'methylation'
    | 'ubiquitination'
    | 'sumoylation'
    | 'glycosylation'
    | 'other';
  /** Known kinase/enzyme (optional) */
  enzyme?: string;
  /** Is this site validated experimentally? */
  validated?: boolean;
}

/**
 * Complete protein data structure
 */
export interface ProteinData {
  protein: Protein;
  domains: ProteinDomain[];
  regions?: ProteinRegion[];
  ptmSites?: PTMSite[];
}

/**
 * Standard domain color palette
 */
export const DOMAIN_COLORS: Record<string, string> = {
  // Common domain types
  'DNA-binding': '#E74C3C',
  Kinase: '#3498DB',
  SH2: '#9B59B6',
  SH3: '#1ABC9C',
  PH: '#F39C12',
  WD40: '#2ECC71',
  'Zinc finger': '#E67E22',
  Helicase: '#34495E',
  Transactivation: '#16A085',
  Tetramerization: '#8E44AD',
  Regulatory: '#D35400',

  // Default colors for unknown domains
  default: '#95A5A6',
};

/**
 * Get color for a domain type
 */
export function getDomainColor(domainName: string, customColor?: string): string {
  if (customColor) return customColor;

  // Try to match domain name to known types
  const lowerName = domainName.toLowerCase();
  for (const [key, color] of Object.entries(DOMAIN_COLORS)) {
    if (lowerName.includes(key.toLowerCase())) {
      return color;
    }
  }

  return DOMAIN_COLORS.default;
}
