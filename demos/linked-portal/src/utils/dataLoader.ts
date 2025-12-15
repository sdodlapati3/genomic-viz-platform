/**
 * Data Loader - Utilities for loading gene and sample data
 *
 * Supports:
 * - Loading from local JSON files
 * - Loading from remote APIs
 * - Data validation and transformation
 */

import type { GeneData, Mutation, Sample, ProteinDomain, ConsequenceType } from '../types';

export interface LoadOptions {
  basePath?: string;
}

/**
 * Load TP53 mutation data from JSON file
 */
export async function loadGeneData(options: LoadOptions = {}): Promise<GeneData> {
  const basePath = options.basePath || '/data';

  try {
    const response = await fetch(`${basePath}/tp53_mutations.json`);
    if (!response.ok) {
      throw new Error(`Failed to load gene data: ${response.status}`);
    }

    const data = await response.json();
    return transformGeneData(data);
  } catch (error) {
    console.error('Error loading gene data:', error);
    // Return demo data on error
    return getDemoGeneData();
  }
}

/**
 * Load sample data from JSON file
 */
export async function loadSampleData(options: LoadOptions = {}): Promise<Sample[]> {
  const basePath = options.basePath || '/data';

  try {
    const response = await fetch(`${basePath}/samples.json`);
    if (!response.ok) {
      throw new Error(`Failed to load sample data: ${response.status}`);
    }

    const data = await response.json();
    return transformSampleData(data);
  } catch (error) {
    console.error('Error loading sample data:', error);
    // Return demo data on error
    return getDemoSampleData();
  }
}

/**
 * Load all data for the portal
 */
export async function loadAllData(options: LoadOptions = {}): Promise<{
  geneData: GeneData;
  samples: Sample[];
}> {
  const [geneData, samples] = await Promise.all([loadGeneData(options), loadSampleData(options)]);

  return { geneData, samples };
}

/**
 * Transform raw gene data to our format
 */
function transformGeneData(raw: any): GeneData {
  // Handle various input formats
  const mutations: Mutation[] = (raw.mutations || []).map((m: any, index: number) => ({
    id: m.id || `mut_${index}_${m.position}_${m.aaChange || ''}`,
    gene: m.gene || raw.gene || 'TP53',
    position: m.position || m.aminoAcid || 0,
    aaRef: m.aaRef || m.referenceAA || '',
    aaAlt: m.aaAlt || m.alternateAA || '',
    aaChange: m.aaChange || `${m.aaRef || ''}${m.position || ''}${m.aaAlt || ''}`,
    type: normalizeConsequenceType(m.type || m.consequence || m.mutationType),
    count: m.count || m.occurrences || 1,
    sampleIds: m.sampleIds || m.samples || [],
    chromosome: m.chromosome || raw.chromosome || m.chr || 'chr17',
    genomicPosition: m.genomicPosition || m.genomicPos,
    reference: m.reference || m.ref,
    alternate: m.alternate || m.alt,
  }));

  const domains: ProteinDomain[] = (raw.domains || []).map((d: any) => ({
    name: d.name,
    start: d.start,
    end: d.end,
    description: d.description || '',
    color: d.color || getDefaultDomainColor(d.name),
  }));

  return {
    gene: raw.gene || 'TP53',
    proteinLength: raw.proteinLength || raw.length || 393,
    mutations,
    domains,
  };
}

/**
 * Transform raw sample data to our format
 */
function transformSampleData(raw: any): Sample[] {
  const samples = Array.isArray(raw) ? raw : raw.samples || [];

  return samples.map((s: any) => ({
    sampleId: s.sampleId || s.id || s.sample_id,
    patientId: s.patientId || s.patient_id || s.sampleId,
    disease: s.disease || s.cancerType || s.diagnosis || 'Unknown',
    stage: s.stage,
    age: s.age || s.ageAtDiagnosis,
    sex: normalizeSex(s.sex || s.gender),
    treatmentStatus: s.treatmentStatus || s.treatment || s.treatmentGroup,
    vitalStatus: normalizeVitalStatus(
      s.survivalEvent !== undefined
        ? s.survivalEvent
          ? 'deceased'
          : 'alive'
        : s.vitalStatus || s.status
    ),
    survivalMonths:
      s.survivalMonths ||
      s.survival ||
      s.os_months ||
      (s.survivalTime ? s.survivalTime / 30.44 : undefined), // Convert days to months
    metadata: s.metadata || {},
  }));
}

/**
 * Normalize consequence type string to our enum
 */
function normalizeConsequenceType(type: string): ConsequenceType {
  const normalized = type?.toLowerCase() || '';

  if (normalized.includes('missense')) return 'missense';
  if (normalized.includes('nonsense') || normalized.includes('stop')) return 'nonsense';
  if (normalized.includes('frameshift')) return 'frameshift';
  if (normalized.includes('splice')) return 'splice';
  if (normalized.includes('inframe')) {
    return normalized.includes('del') ? 'inframe_deletion' : 'inframe_insertion';
  }
  if (normalized.includes('silent') || normalized.includes('synonymous')) return 'silent';

  return 'other';
}

/**
 * Normalize sex field
 */
function normalizeSex(sex: string | undefined): 'male' | 'female' | 'unknown' {
  const normalized = sex?.toLowerCase() || '';
  if (normalized === 'm' || normalized === 'male') return 'male';
  if (normalized === 'f' || normalized === 'female') return 'female';
  return 'unknown';
}

/**
 * Normalize vital status field
 */
function normalizeVitalStatus(status: string | undefined): 'alive' | 'deceased' | 'unknown' {
  const normalized = status?.toLowerCase() || '';
  if (normalized === 'alive' || normalized === 'living') return 'alive';
  if (normalized === 'deceased' || normalized === 'dead') return 'deceased';
  return 'unknown';
}

/**
 * Get default color for domain by name
 */
function getDefaultDomainColor(name: string): string {
  const colors: Record<string, string> = {
    TAD1: '#e74c3c',
    TAD2: '#e74c3c',
    'Proline-rich': '#f39c12',
    'DNA-binding': '#3498db',
    Tetramerization: '#9b59b6',
    Regulatory: '#2ecc71',
  };

  // Try partial match
  for (const [key, color] of Object.entries(colors)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }

  return '#95a5a6';
}

/**
 * Demo TP53 gene data for development/fallback
 */
function getDemoGeneData(): GeneData {
  return {
    gene: 'TP53',
    proteinLength: 393,
    mutations: [
      {
        id: 'mut1',
        gene: 'TP53',
        position: 175,
        aaRef: 'R',
        aaAlt: 'H',
        aaChange: 'R175H',
        type: 'missense',
        count: 45,
        sampleIds: ['S001', 'S002', 'S003'],
      },
      {
        id: 'mut2',
        gene: 'TP53',
        position: 248,
        aaRef: 'R',
        aaAlt: 'W',
        aaChange: 'R248W',
        type: 'missense',
        count: 38,
        sampleIds: ['S002', 'S004'],
      },
      {
        id: 'mut3',
        gene: 'TP53',
        position: 273,
        aaRef: 'R',
        aaAlt: 'H',
        aaChange: 'R273H',
        type: 'missense',
        count: 35,
        sampleIds: ['S001', 'S005'],
      },
      {
        id: 'mut4',
        gene: 'TP53',
        position: 249,
        aaRef: 'R',
        aaAlt: 'S',
        aaChange: 'R249S',
        type: 'missense',
        count: 28,
        sampleIds: ['S003', 'S006'],
      },
      {
        id: 'mut5',
        gene: 'TP53',
        position: 282,
        aaRef: 'R',
        aaAlt: 'W',
        aaChange: 'R282W',
        type: 'missense',
        count: 22,
        sampleIds: ['S004', 'S007'],
      },
      {
        id: 'mut6',
        gene: 'TP53',
        position: 245,
        aaRef: 'G',
        aaAlt: 'S',
        aaChange: 'G245S',
        type: 'missense',
        count: 18,
        sampleIds: ['S005', 'S008'],
      },
      {
        id: 'mut7',
        gene: 'TP53',
        position: 220,
        aaRef: 'Y',
        aaAlt: '*',
        aaChange: 'Y220*',
        type: 'nonsense',
        count: 12,
        sampleIds: ['S006', 'S009'],
      },
      {
        id: 'mut8',
        gene: 'TP53',
        position: 196,
        aaRef: 'R',
        aaAlt: 'fs',
        aaChange: 'R196fs',
        type: 'frameshift',
        count: 8,
        sampleIds: ['S007', 'S010'],
      },
      {
        id: 'mut9',
        gene: 'TP53',
        position: 125,
        aaRef: 'splice',
        aaAlt: '',
        aaChange: 'splice',
        type: 'splice',
        count: 6,
        sampleIds: ['S008'],
      },
      {
        id: 'mut10',
        gene: 'TP53',
        position: 337,
        aaRef: 'R',
        aaAlt: 'C',
        aaChange: 'R337C',
        type: 'missense',
        count: 5,
        sampleIds: ['S009', 'S010'],
      },
    ],
    domains: [
      {
        name: 'TAD1',
        start: 1,
        end: 40,
        description: 'Transactivation domain 1',
        color: '#e74c3c',
      },
      {
        name: 'TAD2',
        start: 41,
        end: 61,
        description: 'Transactivation domain 2',
        color: '#e74c3c',
      },
      {
        name: 'Proline-rich',
        start: 62,
        end: 94,
        description: 'Proline-rich region',
        color: '#f39c12',
      },
      {
        name: 'DNA-binding',
        start: 95,
        end: 289,
        description: 'DNA-binding domain',
        color: '#3498db',
      },
      {
        name: 'Tetramerization',
        start: 324,
        end: 355,
        description: 'Tetramerization domain',
        color: '#9b59b6',
      },
      {
        name: 'Regulatory',
        start: 356,
        end: 393,
        description: 'C-terminal regulatory domain',
        color: '#2ecc71',
      },
    ],
  };
}

/**
 * Demo sample data for development/fallback
 */
function getDemoSampleData(): Sample[] {
  return [
    {
      sampleId: 'S001',
      patientId: 'P001',
      disease: 'Breast Cancer',
      stage: 'III',
      age: 52,
      sex: 'female',
      vitalStatus: 'alive',
      survivalMonths: 36.5,
    },
    {
      sampleId: 'S002',
      patientId: 'P002',
      disease: 'Lung Cancer',
      stage: 'IV',
      age: 68,
      sex: 'male',
      vitalStatus: 'deceased',
      survivalMonths: 12.3,
    },
    {
      sampleId: 'S003',
      patientId: 'P003',
      disease: 'Colorectal Cancer',
      stage: 'II',
      age: 45,
      sex: 'male',
      vitalStatus: 'alive',
      survivalMonths: 48.0,
    },
    {
      sampleId: 'S004',
      patientId: 'P004',
      disease: 'Breast Cancer',
      stage: 'II',
      age: 61,
      sex: 'female',
      vitalStatus: 'alive',
      survivalMonths: 60.2,
    },
    {
      sampleId: 'S005',
      patientId: 'P005',
      disease: 'Lung Cancer',
      stage: 'III',
      age: 55,
      sex: 'female',
      vitalStatus: 'deceased',
      survivalMonths: 18.7,
    },
    {
      sampleId: 'S006',
      patientId: 'P006',
      disease: 'Ovarian Cancer',
      stage: 'III',
      age: 63,
      sex: 'female',
      vitalStatus: 'alive',
      survivalMonths: 24.1,
    },
    {
      sampleId: 'S007',
      patientId: 'P007',
      disease: 'Leukemia',
      stage: 'IV',
      age: 34,
      sex: 'male',
      vitalStatus: 'alive',
      survivalMonths: 42.0,
    },
    {
      sampleId: 'S008',
      patientId: 'P008',
      disease: 'Breast Cancer',
      stage: 'I',
      age: 48,
      sex: 'female',
      vitalStatus: 'alive',
      survivalMonths: 72.5,
    },
    {
      sampleId: 'S009',
      patientId: 'P009',
      disease: 'Colorectal Cancer',
      stage: 'III',
      age: 71,
      sex: 'female',
      vitalStatus: 'deceased',
      survivalMonths: 8.9,
    },
    {
      sampleId: 'S010',
      patientId: 'P010',
      disease: 'Lung Cancer',
      stage: 'II',
      age: 58,
      sex: 'male',
      vitalStatus: 'alive',
      survivalMonths: 30.0,
    },
  ];
}
