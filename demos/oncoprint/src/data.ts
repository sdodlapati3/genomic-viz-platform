/**
 * Oncoprint Data Utilities
 *
 * Functions for loading, transforming, and processing oncoprint data
 */

import type {
  MutationEvent,
  OncoprintData,
  GeneRow,
  SampleColumn,
  SampleAnnotation,
  OncoprintCell,
  ConsequenceType,
  SortConfig,
  FilterConfig,
} from './types';

/**
 * Generate demo oncoprint data
 * Creates a realistic gene × sample mutation matrix
 */
export function generateDemoData(): OncoprintData {
  const genes = ['TP53', 'KRAS', 'EGFR', 'BRAF', 'PIK3CA', 'PTEN', 'APC', 'BRCA1', 'BRCA2', 'ATM'];
  const diseases = ['Lung Adenocarcinoma', 'Colorectal', 'Breast', 'Glioblastoma', 'Melanoma'];
  const stages = ['I', 'II', 'III', 'IV'];
  const mutationTypes: ConsequenceType[] = [
    'missense',
    'nonsense',
    'frameshift',
    'splice',
    'inframe_indel',
  ];

  // Generate 50 samples
  const numSamples = 50;
  const annotations: SampleAnnotation[] = [];
  const allMutations: MutationEvent[] = [];

  for (let i = 0; i < numSamples; i++) {
    const sampleId = `SAMPLE-${String(i + 1).padStart(3, '0')}`;

    annotations.push({
      sampleId,
      disease: diseases[Math.floor(Math.random() * diseases.length)],
      stage: stages[Math.floor(Math.random() * stages.length)],
      age: Math.floor(40 + Math.random() * 50),
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
    });

    // Each sample has mutations in 2-6 genes
    const numMutations = 2 + Math.floor(Math.random() * 5);
    const mutatedGenes = shuffleArray([...genes]).slice(0, numMutations);

    for (const gene of mutatedGenes) {
      // Sometimes a sample has multiple mutations in the same gene
      const numMutsInGene = Math.random() > 0.8 ? 2 : 1;

      for (let j = 0; j < numMutsInGene; j++) {
        const type = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];
        const position = Math.floor(Math.random() * 400) + 1;
        const aaRef = randomAminoAcid();
        const aaAlt = randomAminoAcid();

        allMutations.push({
          id: `mut-${sampleId}-${gene}-${j}`,
          gene,
          sampleId,
          position,
          aaChange: `${aaRef}${position}${aaAlt}`,
          type,
          vaf: Math.random() * 0.5 + 0.1,
        });
      }
    }
  }

  return buildOncoprintData(allMutations, annotations);
}

/**
 * Build OncoprintData from raw mutations and annotations
 */
export function buildOncoprintData(
  mutations: MutationEvent[],
  annotations: SampleAnnotation[]
): OncoprintData {
  // Group mutations by gene and sample
  const mutationMap = new Map<string, Map<string, MutationEvent[]>>();
  const sampleSet = new Set<string>();
  const geneSet = new Set<string>();

  for (const mut of mutations) {
    sampleSet.add(mut.sampleId);
    geneSet.add(mut.gene);

    if (!mutationMap.has(mut.gene)) {
      mutationMap.set(mut.gene, new Map());
    }
    const geneMap = mutationMap.get(mut.gene)!;

    if (!geneMap.has(mut.sampleId)) {
      geneMap.set(mut.sampleId, []);
    }
    geneMap.get(mut.sampleId)!.push(mut);
  }

  const samples = Array.from(sampleSet);
  const geneNames = Array.from(geneSet);

  // Build gene rows
  const genes: GeneRow[] = geneNames.map((gene) => {
    const geneMap = mutationMap.get(gene) || new Map();

    const cells: OncoprintCell[] = samples.map((sampleId) => {
      const cellMutations = geneMap.get(sampleId) || [];
      return {
        gene,
        sampleId,
        mutations: cellMutations,
        hasMutation: cellMutations.length > 0,
      };
    });

    const mutatedSamples = cells.filter((c) => c.hasMutation).length;

    return {
      gene,
      cells,
      mutationCount: cells.reduce((sum, c) => sum + c.mutations.length, 0),
      sampleCount: mutatedSamples,
      frequency: (mutatedSamples / samples.length) * 100,
    };
  });

  // Build sample columns
  const sampleColumns: SampleColumn[] = samples.map((sampleId) => {
    const sampleMutations = mutations.filter((m) => m.sampleId === sampleId);
    const mutatedGenes = [...new Set(sampleMutations.map((m) => m.gene))];

    return {
      sampleId,
      disease: annotations.find((a) => a.sampleId === sampleId)?.disease,
      mutationCount: sampleMutations.length,
      genes: mutatedGenes,
    };
  });

  return {
    genes,
    samples: sampleColumns,
    annotations,
    totalMutations: mutations.length,
  };
}

/**
 * Sort oncoprint data
 */
export function sortOncoprintData(data: OncoprintData, config: SortConfig): OncoprintData {
  const { field, direction } = config;
  // For descending order (default), we want highest values first
  // So multiplier is 1 for desc (no flip) and -1 for asc (flip the comparison)
  const multiplier = direction === 'desc' ? 1 : -1;

  let sortedGenes = [...data.genes];
  let sortedSamples = [...data.samples];

  switch (field) {
    case 'frequency':
      // Sort genes by mutation frequency (highest first when desc)
      sortedGenes = sortedGenes.sort((a, b) => multiplier * (b.frequency - a.frequency));
      break;
    case 'gene':
      sortedGenes = sortedGenes.sort((a, b) => multiplier * a.gene.localeCompare(b.gene));
      break;
    case 'sample':
      sortedSamples = sortedSamples.sort(
        (a, b) => multiplier * a.sampleId.localeCompare(b.sampleId)
      );
      break;
    case 'mutations':
      sortedSamples = sortedSamples.sort(
        (a, b) => multiplier * (b.mutationCount - a.mutationCount)
      );
      break;
  }

  // Reorder cells in each gene to match sample order
  const sampleOrder = new Map(sortedSamples.map((s, i) => [s.sampleId, i]));

  for (const gene of sortedGenes) {
    gene.cells = gene.cells.sort(
      (a, b) => (sampleOrder.get(a.sampleId) || 0) - (sampleOrder.get(b.sampleId) || 0)
    );
  }

  return {
    ...data,
    genes: sortedGenes,
    samples: sortedSamples,
  };
}

/**
 * Filter oncoprint data
 */
export function filterOncoprintData(data: OncoprintData, config: FilterConfig): OncoprintData {
  let filteredGenes = data.genes;
  let filteredSamples = data.samples;

  // Filter by mutation types
  if (config.mutationTypes.length > 0) {
    filteredGenes = filteredGenes.map((gene) => ({
      ...gene,
      cells: gene.cells.map((cell) => ({
        ...cell,
        mutations: cell.mutations.filter((m) => config.mutationTypes.includes(m.type)),
        hasMutation: cell.mutations.some((m) => config.mutationTypes.includes(m.type)),
      })),
    }));
  }

  // Filter by minimum frequency
  if (config.minFrequency > 0) {
    filteredGenes = filteredGenes.filter((g) => g.frequency >= config.minFrequency);
  }

  // Filter by specific genes
  if (config.genes.length > 0) {
    filteredGenes = filteredGenes.filter((g) => config.genes.includes(g.gene));
  }

  // Filter by specific samples
  if (config.samples.length > 0) {
    const sampleSet = new Set(config.samples);
    filteredSamples = filteredSamples.filter((s) => sampleSet.has(s.sampleId));
    filteredGenes = filteredGenes.map((gene) => ({
      ...gene,
      cells: gene.cells.filter((c) => sampleSet.has(c.sampleId)),
    }));
  }

  // Recalculate statistics
  for (const gene of filteredGenes) {
    const mutatedCells = gene.cells.filter((c) => c.hasMutation);
    gene.sampleCount = mutatedCells.length;
    gene.mutationCount = gene.cells.reduce((sum, c) => sum + c.mutations.length, 0);
    gene.frequency = (mutatedCells.length / filteredSamples.length) * 100;
  }

  return {
    ...data,
    genes: filteredGenes,
    samples: filteredSamples,
    totalMutations: filteredGenes.reduce((sum, g) => sum + g.mutationCount, 0),
  };
}

// Helper functions
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function randomAminoAcid(): string {
  const aa = 'ACDEFGHIKLMNPQRSTVWY';
  return aa[Math.floor(Math.random() * aa.length)];
}
