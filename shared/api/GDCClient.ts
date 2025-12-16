/**
 * GDC (Genomic Data Commons) Integration Module
 * Provides client for querying NCI GDC API endpoints
 *
 * API Documentation: https://docs.gdc.cancer.gov/API/Users_Guide/
 */

const GDC_API_BASE = 'https://api.gdc.cancer.gov';

export interface GDCQueryFilters {
  op:
    | 'and'
    | 'or'
    | 'in'
    | '='
    | '!='
    | '<'
    | '>'
    | '<='
    | '>='
    | 'is'
    | 'not'
    | 'range'
    | 'exists';
  content: GDCFilterContent | GDCQueryFilters[];
}

export interface GDCFilterContent {
  field: string;
  value: string | string[] | number | number[] | boolean;
}

export interface GDCQueryParams {
  filters?: GDCQueryFilters;
  fields?: string[];
  expand?: string[];
  size?: number;
  from?: number;
  sort?: string;
  format?: 'json' | 'tsv';
}

export interface GDCResponse<T> {
  data: {
    hits: T[];
    pagination: {
      count: number;
      total: number;
      size: number;
      from: number;
      page: number;
      pages: number;
    };
  };
  warnings?: Record<string, unknown>;
}

export interface GDCCase {
  case_id: string;
  submitter_id: string;
  project: {
    project_id: string;
    name: string;
    primary_site: string;
  };
  demographic?: {
    gender: string;
    race: string;
    ethnicity: string;
    year_of_birth: number;
    vital_status: string;
    days_to_death: number | null;
  };
  diagnoses?: Array<{
    diagnosis_id: string;
    primary_diagnosis: string;
    tumor_stage: string;
    age_at_diagnosis: number;
  }>;
}

export interface GDCProject {
  project_id: string;
  name: string;
  program: {
    name: string;
    program_id: string;
  };
  primary_site: string[];
  summary: {
    case_count: number;
    file_count: number;
    data_categories: Array<{
      data_category: string;
      case_count: number;
    }>;
  };
}

export interface GDCGene {
  gene_id: string;
  symbol: string;
  name: string;
  biotype: string;
  chromosome: string;
  start_position: number;
  end_position: number;
  is_cancer_gene_census: boolean;
}

export interface GDCMutation {
  ssm_id: string;
  genomic_dna_change: string;
  mutation_type: string;
  consequence: Array<{
    transcript: {
      transcript_id: string;
      gene: {
        gene_id: string;
        symbol: string;
      };
    };
    consequence_type: string;
    aa_change: string;
  }>;
}

export interface GDCSurvivalData {
  survivalData: Array<{
    donors: Array<{
      id: string;
      time: number;
      censored: boolean;
    }>;
    meta: {
      id: string;
      name: string;
    };
  }>;
}

/**
 * GDC API Client
 */
export class GDCClient {
  private baseUrl: string;

  constructor(baseUrl: string = GDC_API_BASE) {
    this.baseUrl = baseUrl;
  }

  /**
   * Build query string from params
   */
  private buildQueryString(params: GDCQueryParams): string {
    const queryParts: string[] = [];

    if (params.filters) {
      queryParts.push(`filters=${encodeURIComponent(JSON.stringify(params.filters))}`);
    }
    if (params.fields && params.fields.length > 0) {
      queryParts.push(`fields=${params.fields.join(',')}`);
    }
    if (params.expand && params.expand.length > 0) {
      queryParts.push(`expand=${params.expand.join(',')}`);
    }
    if (params.size !== undefined) {
      queryParts.push(`size=${params.size}`);
    }
    if (params.from !== undefined) {
      queryParts.push(`from=${params.from}`);
    }
    if (params.sort) {
      queryParts.push(`sort=${params.sort}`);
    }

    return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  }

  /**
   * Fetch cases from GDC
   */
  async getCases(params: GDCQueryParams = {}): Promise<GDCResponse<GDCCase>> {
    const defaultFields = [
      'case_id',
      'submitter_id',
      'project.project_id',
      'project.name',
      'project.primary_site',
    ];

    const defaultExpand = ['demographic', 'diagnoses'];

    const query = this.buildQueryString({
      fields: params.fields || defaultFields,
      expand: params.expand || defaultExpand,
      size: params.size || 10,
      ...params,
    });

    const response = await fetch(`${this.baseUrl}/cases${query}`);
    if (!response.ok) {
      throw new Error(`GDC API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch projects from GDC
   */
  async getProjects(params: GDCQueryParams = {}): Promise<GDCResponse<GDCProject>> {
    const defaultFields = [
      'project_id',
      'name',
      'program.name',
      'program.program_id',
      'primary_site',
      'summary.case_count',
      'summary.file_count',
    ];

    const query = this.buildQueryString({
      fields: params.fields || defaultFields,
      size: params.size || 100,
      ...params,
    });

    const response = await fetch(`${this.baseUrl}/projects${query}`);
    if (!response.ok) {
      throw new Error(`GDC API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch genes from GDC
   */
  async getGenes(params: GDCQueryParams = {}): Promise<GDCResponse<GDCGene>> {
    const defaultFields = [
      'gene_id',
      'symbol',
      'name',
      'biotype',
      'chromosome',
      'start_position',
      'end_position',
      'is_cancer_gene_census',
    ];

    const query = this.buildQueryString({
      fields: params.fields || defaultFields,
      size: params.size || 20,
      ...params,
    });

    const response = await fetch(`${this.baseUrl}/genes${query}`);
    if (!response.ok) {
      throw new Error(`GDC API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch mutations (SSMs) from GDC
   */
  async getMutations(params: GDCQueryParams = {}): Promise<GDCResponse<GDCMutation>> {
    const query = this.buildQueryString({
      size: params.size || 20,
      expand: ['consequence.transcript.gene'],
      ...params,
    });

    const response = await fetch(`${this.baseUrl}/ssms${query}`);
    if (!response.ok) {
      throw new Error(`GDC API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch survival data for analysis
   */
  async getSurvivalData(filters?: GDCQueryFilters): Promise<GDCSurvivalData> {
    const body: Record<string, unknown> = {};
    if (filters) {
      body.filters = filters;
    }

    const response = await fetch(`${this.baseUrl}/analysis/survival`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`GDC API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Search cases by gene mutation
   */
  async getCasesWithGeneMutation(
    geneSymbol: string,
    size: number = 100
  ): Promise<GDCResponse<GDCCase>> {
    const filters: GDCQueryFilters = {
      op: 'and',
      content: [
        {
          op: 'in',
          content: {
            field: 'genes.symbol',
            value: [geneSymbol],
          },
        },
      ],
    };

    return this.getCases({ filters, size });
  }

  /**
   * Search projects by primary site
   */
  async getProjectsByPrimarySite(primarySite: string): Promise<GDCResponse<GDCProject>> {
    const filters: GDCQueryFilters = {
      op: 'in',
      content: {
        field: 'primary_site',
        value: [primarySite],
      },
    };

    return this.getProjects({ filters });
  }

  /**
   * Get cancer gene census genes
   */
  async getCancerGenes(size: number = 100): Promise<GDCResponse<GDCGene>> {
    const filters: GDCQueryFilters = {
      op: '=',
      content: {
        field: 'is_cancer_gene_census',
        value: true,
      },
    };

    return this.getGenes({ filters, size });
  }

  /**
   * Get mutations for a specific gene
   */
  async getMutationsForGene(
    geneSymbol: string,
    size: number = 100
  ): Promise<GDCResponse<GDCMutation>> {
    const filters: GDCQueryFilters = {
      op: '=',
      content: {
        field: 'consequence.transcript.gene.symbol',
        value: geneSymbol,
      },
    };

    return this.getMutations({ filters, size });
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId: string): Promise<{
    caseCount: number;
    fileCount: number;
    dataCategories: Array<{ category: string; count: number }>;
  }> {
    const filters: GDCQueryFilters = {
      op: '=',
      content: {
        field: 'project_id',
        value: projectId,
      },
    };

    const project = await this.getProjects({
      filters,
      fields: ['project_id', 'summary.case_count', 'summary.file_count', 'summary.data_categories'],
    });

    if (project.data.hits.length === 0) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const hit = project.data.hits[0];
    return {
      caseCount: hit.summary.case_count,
      fileCount: hit.summary.file_count,
      dataCategories:
        hit.summary.data_categories?.map((dc) => ({
          category: dc.data_category,
          count: dc.case_count,
        })) || [],
    };
  }
}

/**
 * Helper to convert GDC mutations to platform format
 */
export function convertGDCMutations(mutations: GDCMutation[]): Array<{
  chr: string;
  pos: number;
  gene: string;
  class: string;
  mname: string;
}> {
  return mutations.flatMap((mut) => {
    const genomicChange = mut.genomic_dna_change;
    const match = genomicChange.match(/chr(\w+):g\.(\d+)/);

    if (!match) return [];

    const chr = `chr${match[1]}`;
    const pos = parseInt(match[2], 10);

    return mut.consequence.map((cons) => ({
      chr,
      pos,
      gene: cons.transcript.gene.symbol,
      class: mapMutationType(cons.consequence_type),
      mname: cons.aa_change || mut.mutation_type,
    }));
  });
}

/**
 * Map GDC consequence types to platform mutation classes
 */
function mapMutationType(consequenceType: string): string {
  const mapping: Record<string, string> = {
    missense_variant: 'missense',
    stop_gained: 'nonsense',
    frameshift_variant: 'frameshift',
    splice_acceptor_variant: 'splice',
    splice_donor_variant: 'splice',
    inframe_insertion: 'inframe',
    inframe_deletion: 'inframe',
    synonymous_variant: 'silent',
    '5_prime_UTR_variant': 'utr_5',
    '3_prime_UTR_variant': 'utr_3',
    intron_variant: 'intron',
  };

  return mapping[consequenceType] || 'other';
}

// Default export for easy usage
export const gdc = new GDCClient();
