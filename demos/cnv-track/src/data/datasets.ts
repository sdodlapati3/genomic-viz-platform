import { CNVSample, CNVSegment, CNVProbe, Gene, Chromosome, Cytoband } from '../types';

// Chromosome data (GRCh38)
export const chromosomes: Chromosome[] = [
  { id: 'chr1', name: '1', size: 248956422, centromereStart: 121535434, centromereEnd: 124535434 },
  { id: 'chr2', name: '2', size: 242193529, centromereStart: 92326171, centromereEnd: 95326171 },
  { id: 'chr3', name: '3', size: 198295559, centromereStart: 90504854, centromereEnd: 93504854 },
  { id: 'chr4', name: '4', size: 190214555, centromereStart: 49660117, centromereEnd: 52660117 },
  { id: 'chr5', name: '5', size: 181538259, centromereStart: 46405641, centromereEnd: 49405641 },
  { id: 'chr6', name: '6', size: 170805979, centromereStart: 58830166, centromereEnd: 61830166 },
  { id: 'chr7', name: '7', size: 159345973, centromereStart: 58054331, centromereEnd: 61054331 },
  { id: 'chr8', name: '8', size: 145138636, centromereStart: 43838887, centromereEnd: 46838887 },
  { id: 'chr9', name: '9', size: 138394717, centromereStart: 47367679, centromereEnd: 50367679 },
  { id: 'chr10', name: '10', size: 133797422, centromereStart: 39254935, centromereEnd: 42254935 },
  { id: 'chr11', name: '11', size: 135086622, centromereStart: 51644205, centromereEnd: 54644205 },
  { id: 'chr12', name: '12', size: 133275309, centromereStart: 34856694, centromereEnd: 37856694 },
  { id: 'chr13', name: '13', size: 114364328, centromereStart: 16000000, centromereEnd: 19000000 },
  { id: 'chr14', name: '14', size: 107043718, centromereStart: 16000000, centromereEnd: 19000000 },
  { id: 'chr15', name: '15', size: 101991189, centromereStart: 17000000, centromereEnd: 20000000 },
  { id: 'chr16', name: '16', size: 90338345, centromereStart: 35335801, centromereEnd: 38335801 },
  { id: 'chr17', name: '17', size: 83257441, centromereStart: 22263006, centromereEnd: 25263006 },
  { id: 'chr18', name: '18', size: 80373285, centromereStart: 15460898, centromereEnd: 18460898 },
  { id: 'chr19', name: '19', size: 58617616, centromereStart: 24681782, centromereEnd: 27681782 },
  { id: 'chr20', name: '20', size: 64444167, centromereStart: 26369569, centromereEnd: 29369569 },
  { id: 'chr21', name: '21', size: 46709983, centromereStart: 11288129, centromereEnd: 14288129 },
  { id: 'chr22', name: '22', size: 50818468, centromereStart: 13000000, centromereEnd: 16000000 },
  { id: 'chrX', name: 'X', size: 156040895, centromereStart: 58632012, centromereEnd: 61632012 },
  { id: 'chrY', name: 'Y', size: 57227415, centromereStart: 10104553, centromereEnd: 13104553 },
];

// Cancer-related genes
const cancerGenes: Gene[] = [
  {
    symbol: 'EGFR',
    chromosome: 'chr7',
    start: 55019017,
    end: 55211628,
    strand: '+',
    type: 'oncogene',
  },
  {
    symbol: 'BRAF',
    chromosome: 'chr7',
    start: 140719327,
    end: 140924929,
    strand: '-',
    type: 'oncogene',
  },
  {
    symbol: 'MET',
    chromosome: 'chr7',
    start: 116672196,
    end: 116798386,
    strand: '+',
    type: 'oncogene',
  },
  {
    symbol: 'MYC',
    chromosome: 'chr8',
    start: 127735434,
    end: 127742951,
    strand: '+',
    type: 'oncogene',
  },
  {
    symbol: 'CDKN2A',
    chromosome: 'chr9',
    start: 21967751,
    end: 21995301,
    strand: '-',
    type: 'tumor_suppressor',
  },
  {
    symbol: 'PTEN',
    chromosome: 'chr10',
    start: 87863113,
    end: 87971930,
    strand: '+',
    type: 'tumor_suppressor',
  },
  {
    symbol: 'CCND1',
    chromosome: 'chr11',
    start: 69641156,
    end: 69654474,
    strand: '-',
    type: 'oncogene',
  },
  {
    symbol: 'CDK4',
    chromosome: 'chr12',
    start: 58141510,
    end: 58146164,
    strand: '+',
    type: 'oncogene',
  },
  {
    symbol: 'MDM2',
    chromosome: 'chr12',
    start: 68808172,
    end: 68850686,
    strand: '+',
    type: 'oncogene',
  },
  {
    symbol: 'RB1',
    chromosome: 'chr13',
    start: 48303747,
    end: 48481890,
    strand: '-',
    type: 'tumor_suppressor',
  },
  {
    symbol: 'TP53',
    chromosome: 'chr17',
    start: 7668421,
    end: 7687490,
    strand: '-',
    type: 'tumor_suppressor',
  },
  {
    symbol: 'ERBB2',
    chromosome: 'chr17',
    start: 39687914,
    end: 39730426,
    strand: '+',
    type: 'oncogene',
  },
  {
    symbol: 'BRCA1',
    chromosome: 'chr17',
    start: 43044295,
    end: 43170245,
    strand: '-',
    type: 'tumor_suppressor',
  },
  {
    symbol: 'STK11',
    chromosome: 'chr19',
    start: 1205798,
    end: 1228434,
    strand: '+',
    type: 'tumor_suppressor',
  },
  {
    symbol: 'SMAD4',
    chromosome: 'chr18',
    start: 48556583,
    end: 48611411,
    strand: '+',
    type: 'tumor_suppressor',
  },
  {
    symbol: 'APC',
    chromosome: 'chr5',
    start: 112707498,
    end: 112846239,
    strand: '+',
    type: 'tumor_suppressor',
  },
  {
    symbol: 'KRAS',
    chromosome: 'chr12',
    start: 25204789,
    end: 25250936,
    strand: '-',
    type: 'oncogene',
  },
  {
    symbol: 'PIK3CA',
    chromosome: 'chr3',
    start: 179148114,
    end: 179240093,
    strand: '+',
    type: 'oncogene',
  },
  {
    symbol: 'FGFR1',
    chromosome: 'chr8',
    start: 38411138,
    end: 38468834,
    strand: '-',
    type: 'oncogene',
  },
  {
    symbol: 'MYCN',
    chromosome: 'chr2',
    start: 15940550,
    end: 15947007,
    strand: '+',
    type: 'oncogene',
  },
];

// Generate CNV segments
function generateSegments(chromosome: string | null): CNVSegment[] {
  const segments: CNVSegment[] = [];
  const chroms = chromosome
    ? chromosomes.filter((c) => c.id === chromosome)
    : chromosomes.slice(0, 10);
  let segmentId = 0;

  chroms.forEach((chr) => {
    let pos = 0;
    while (pos < chr.size) {
      const length = Math.floor(1000000 + Math.random() * 20000000);
      const end = Math.min(pos + length, chr.size);

      // Generate log2 ratio with some CNV events
      let log2Ratio = (Math.random() - 0.5) * 0.4; // Mostly neutral

      // Add some CNV events
      if (Math.random() < 0.15) {
        log2Ratio =
          Math.random() < 0.5
            ? 0.5 + Math.random() * 1.5 // Gain/amp
            : -0.5 - Math.random() * 1.5; // Loss/del
      }

      // Classify CNV
      let call: CNVSegment['call'] = 'neutral';
      if (log2Ratio > 1) call = 'amplification';
      else if (log2Ratio > 0.3) call = 'gain';
      else if (log2Ratio < -1) call = 'deep_deletion';
      else if (log2Ratio < -0.3) call = 'loss';

      // Find overlapping genes
      const overlappingGenes = cancerGenes
        .filter((g) => g.chromosome === chr.id && g.start < end && g.end > pos)
        .map((g) => g.symbol);

      segments.push({
        id: `seg_${segmentId++}`,
        chromosome: chr.id,
        start: pos,
        end,
        log2Ratio,
        segmentMean: log2Ratio + (Math.random() - 0.5) * 0.1,
        probeCount: Math.floor(length / 5000),
        call,
        genes: overlappingGenes,
      });

      pos = end;
    }
  });

  return segments;
}

// Generate probe-level data
function generateProbes(segments: CNVSegment[]): CNVProbe[] {
  const probes: CNVProbe[] = [];

  segments.forEach((seg) => {
    const nProbes = Math.min(seg.probeCount, 100); // Limit for performance
    for (let i = 0; i < nProbes; i++) {
      probes.push({
        chromosome: seg.chromosome,
        position: seg.start + Math.floor(Math.random() * (seg.end - seg.start)),
        log2Ratio: seg.log2Ratio + (Math.random() - 0.5) * 0.5,
      });
    }
  });

  return probes.sort((a, b) => {
    if (a.chromosome !== b.chromosome) {
      return (
        chromosomes.findIndex((c) => c.id === a.chromosome) -
        chromosomes.findIndex((c) => c.id === b.chromosome)
      );
    }
    return a.position - b.position;
  });
}

// Calculate sample statistics
function calculateStats(segments: CNVSegment[]): CNVSample['metadata'] {
  const totalSize = segments.reduce((sum, s) => sum + (s.end - s.start), 0);
  const alteredSize = segments
    .filter((s) => s.call !== 'neutral')
    .reduce((sum, s) => sum + (s.end - s.start), 0);

  return {
    ploidy: 2 + (Math.random() - 0.5) * 0.5,
    purity: 0.5 + Math.random() * 0.4,
    nSegments: segments.length,
    fractionAltered: alteredSize / totalSize,
  };
}

// Generate sample data
function createSample(id: string, name: string, description: string): CNVSample {
  const segments = generateSegments(null);
  const probes = generateProbes(segments);

  return {
    id,
    name,
    description,
    segments,
    probes,
    genes: cancerGenes,
    metadata: calculateStats(segments),
  };
}

// Sample datasets
export const tumor1Sample = createSample('tumor1', 'Tumor Sample 1', 'Breast cancer primary tumor');

export const tumor2Sample = createSample('tumor2', 'Tumor Sample 2', 'Lung adenocarcinoma');

export const celllineSample = createSample(
  'cellline',
  'Cancer Cell Line',
  'MCF7 breast cancer cell line'
);

// Dataset registry
export const samples: Record<string, CNVSample> = {
  tumor1: tumor1Sample,
  tumor2: tumor2Sample,
  cellline: celllineSample,
};

export function getSample(id: string): CNVSample {
  return samples[id] || tumor1Sample;
}

export function getChromosome(id: string): Chromosome | undefined {
  return chromosomes.find((c) => c.id === id);
}
