/**
 * Type Definitions for Mini-ProteinPaint
 * Using JSDoc for type safety
 */

/**
 * @typedef {Object} Mutation
 * @property {string} id - Unique mutation identifier
 * @property {string} gene - Gene symbol
 * @property {number} position - Amino acid position
 * @property {string} ref - Reference allele/amino acid
 * @property {string} alt - Alternate allele/amino acid
 * @property {MutationType} type - Mutation type
 * @property {string} sample - Sample identifier
 * @property {string} cancerType - Cancer type
 * @property {string} chromosome - Chromosome
 * @property {number} genomicPosition - Genomic position
 */

/**
 * @typedef {'missense'|'nonsense'|'frameshift'|'splice'|'inframe'|'silent'|'amplification'|'deletion'} MutationType
 */

/**
 * @typedef {Object} SurvivalRecord
 * @property {string} sample - Sample identifier
 * @property {number} time - Time in months
 * @property {0|1} event - Event indicator (1=event, 0=censored)
 * @property {string} cancerType - Cancer type
 * @property {boolean} tp53Mutation - TP53 mutation status
 * @property {number} age - Patient age
 */

/**
 * @typedef {Object} ExpressionData
 * @property {string[]} genes - Gene names
 * @property {string[]} samples - Sample identifiers
 * @property {number[][]} expression - Expression matrix (genes x samples)
 */

/**
 * @typedef {Object} KaplanMeierPoint
 * @property {number} time - Time point
 * @property {number} survival - Survival probability
 * @property {number} nAtRisk - Number at risk
 */

/**
 * @typedef {Object} ProteinDomain
 * @property {string} name - Domain name
 * @property {number} start - Start position
 * @property {number} end - End position
 * @property {string} color - Display color
 */

/**
 * @typedef {Object} ProteinInfo
 * @property {number} length - Protein length
 * @property {ProteinDomain[]} domains - Protein domains
 */

/**
 * @typedef {Object} DifferentialExpressionResult
 * @property {string} gene - Gene name
 * @property {number} log2FoldChange - Log2 fold change
 * @property {number} pValue - P-value
 * @property {number} adjustedPValue - Adjusted p-value (FDR)
 * @property {number} baseMean - Base mean expression
 */

/**
 * @typedef {Object} UMAPPoint
 * @property {string} sample - Sample identifier
 * @property {string} cancerType - Cancer type
 * @property {number} umap1 - UMAP coordinate 1
 * @property {number} umap2 - UMAP coordinate 2
 */

/**
 * @typedef {Object} HazardRatio
 * @property {string} variable - Variable name
 * @property {number} hr - Hazard ratio
 * @property {number} lower - Lower 95% CI
 * @property {number} upper - Upper 95% CI
 * @property {number} pValue - P-value
 */

/**
 * @typedef {Object} APIResponse
 * @property {any} data - Response data
 * @property {Object} [pagination] - Pagination info
 * @property {string} [error] - Error message
 */

/**
 * @typedef {Object} Pagination
 * @property {number} page - Current page
 * @property {number} limit - Items per page
 * @property {number} total - Total items
 * @property {number} pages - Total pages
 */

export const MutationTypes = {
  MISSENSE: 'missense',
  NONSENSE: 'nonsense',
  FRAMESHIFT: 'frameshift',
  SPLICE: 'splice',
  INFRAME: 'inframe',
  SILENT: 'silent',
  AMPLIFICATION: 'amplification',
  DELETION: 'deletion'
};

export const CancerTypes = {
  ALL: 'ALL',
  AML: 'AML',
  NEUROBLASTOMA: 'Neuroblastoma',
  OSTEOSARCOMA: 'Osteosarcoma'
};

export const MutationColors = {
  missense: '#3b82f6',
  nonsense: '#ef4444',
  frameshift: '#8b5cf6',
  splice: '#f59e0b',
  inframe: '#10b981',
  silent: '#6b7280',
  amplification: '#ec4899',
  deletion: '#14b8a6'
};

export const CancerTypeColors = {
  ALL: '#3b82f6',
  AML: '#ef4444',
  Neuroblastoma: '#10b981',
  Osteosarcoma: '#f59e0b'
};
