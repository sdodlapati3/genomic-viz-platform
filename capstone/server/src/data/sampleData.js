/**
 * Sample Data for Mini-ProteinPaint
 * 
 * Mock data for development and testing
 */

// Sample mutation data
export const sampleMutations = [
  // TP53 mutations
  { id: 'mut1', gene: 'TP53', position: 175, ref: 'R', alt: 'H', type: 'missense', sample: 'SJALL001', cancerType: 'ALL', chromosome: '17', genomicPosition: 7578406 },
  { id: 'mut2', gene: 'TP53', position: 248, ref: 'R', alt: 'Q', type: 'missense', sample: 'SJALL002', cancerType: 'ALL', chromosome: '17', genomicPosition: 7577538 },
  { id: 'mut3', gene: 'TP53', position: 273, ref: 'R', alt: 'H', type: 'missense', sample: 'SJAML001', cancerType: 'AML', chromosome: '17', genomicPosition: 7577121 },
  { id: 'mut4', gene: 'TP53', position: 282, ref: 'R', alt: 'W', type: 'missense', sample: 'SJNBL001', cancerType: 'Neuroblastoma', chromosome: '17', genomicPosition: 7577094 },
  { id: 'mut5', gene: 'TP53', position: 175, ref: 'R', alt: 'H', type: 'missense', sample: 'SJAML002', cancerType: 'AML', chromosome: '17', genomicPosition: 7578406 },
  { id: 'mut6', gene: 'TP53', position: 220, ref: 'Y', alt: 'C', type: 'missense', sample: 'SJOS001', cancerType: 'Osteosarcoma', chromosome: '17', genomicPosition: 7578190 },
  
  // KRAS mutations
  { id: 'mut7', gene: 'KRAS', position: 12, ref: 'G', alt: 'D', type: 'missense', sample: 'SJALL003', cancerType: 'ALL', chromosome: '12', genomicPosition: 25398284 },
  { id: 'mut8', gene: 'KRAS', position: 13, ref: 'G', alt: 'D', type: 'missense', sample: 'SJAML003', cancerType: 'AML', chromosome: '12', genomicPosition: 25398281 },
  { id: 'mut9', gene: 'KRAS', position: 61, ref: 'Q', alt: 'H', type: 'missense', sample: 'SJNBL002', cancerType: 'Neuroblastoma', chromosome: '12', genomicPosition: 25380275 },
  
  // NOTCH1 mutations
  { id: 'mut10', gene: 'NOTCH1', position: 1575, ref: 'L', alt: 'P', type: 'missense', sample: 'SJALL004', cancerType: 'ALL', chromosome: '9', genomicPosition: 139390822 },
  { id: 'mut11', gene: 'NOTCH1', position: 2512, ref: 'P', alt: 'fs', type: 'frameshift', sample: 'SJALL005', cancerType: 'ALL', chromosome: '9', genomicPosition: 139388051 },
  
  // CDKN2A mutations
  { id: 'mut12', gene: 'CDKN2A', position: 44, ref: 'R', alt: '*', type: 'nonsense', sample: 'SJALL001', cancerType: 'ALL', chromosome: '9', genomicPosition: 21974680 },
  { id: 'mut13', gene: 'CDKN2A', position: 80, ref: 'P', alt: 'L', type: 'missense', sample: 'SJOS002', cancerType: 'Osteosarcoma', chromosome: '9', genomicPosition: 21974572 },
  
  // RB1 mutations
  { id: 'mut14', gene: 'RB1', position: 455, ref: 'R', alt: '*', type: 'nonsense', sample: 'SJOS001', cancerType: 'Osteosarcoma', chromosome: '13', genomicPosition: 48877887 },
  { id: 'mut15', gene: 'RB1', position: 663, ref: 'R', alt: 'W', type: 'missense', sample: 'SJOS003', cancerType: 'Osteosarcoma', chromosome: '13', genomicPosition: 48942767 },
  
  // ALK mutations (Neuroblastoma)
  { id: 'mut16', gene: 'ALK', position: 1174, ref: 'F', alt: 'L', type: 'missense', sample: 'SJNBL001', cancerType: 'Neuroblastoma', chromosome: '2', genomicPosition: 29443695 },
  { id: 'mut17', gene: 'ALK', position: 1275, ref: 'R', alt: 'Q', type: 'missense', sample: 'SJNBL003', cancerType: 'Neuroblastoma', chromosome: '2', genomicPosition: 29436858 },
  
  // MYCN amplification marker
  { id: 'mut18', gene: 'MYCN', position: 1, ref: '-', alt: 'AMP', type: 'amplification', sample: 'SJNBL002', cancerType: 'Neuroblastoma', chromosome: '2', genomicPosition: 16080683 },
  
  // FLT3 mutations (AML)
  { id: 'mut19', gene: 'FLT3', position: 835, ref: 'D', alt: 'Y', type: 'missense', sample: 'SJAML001', cancerType: 'AML', chromosome: '13', genomicPosition: 28592642 },
  { id: 'mut20', gene: 'FLT3', position: 842, ref: 'I', alt: 'fs', type: 'frameshift', sample: 'SJAML004', cancerType: 'AML', chromosome: '13', genomicPosition: 28592621 }
];

// Sample survival data
export const sampleSurvivalData = [
  { sample: 'SJALL001', time: 24, event: 0, cancerType: 'ALL', tp53Mutation: true, age: 8 },
  { sample: 'SJALL002', time: 36, event: 0, cancerType: 'ALL', tp53Mutation: true, age: 5 },
  { sample: 'SJALL003', time: 18, event: 1, cancerType: 'ALL', tp53Mutation: false, age: 12 },
  { sample: 'SJALL004', time: 48, event: 0, cancerType: 'ALL', tp53Mutation: false, age: 7 },
  { sample: 'SJALL005', time: 12, event: 1, cancerType: 'ALL', tp53Mutation: false, age: 15 },
  { sample: 'SJAML001', time: 8, event: 1, cancerType: 'AML', tp53Mutation: true, age: 10 },
  { sample: 'SJAML002', time: 24, event: 1, cancerType: 'AML', tp53Mutation: true, age: 6 },
  { sample: 'SJAML003', time: 36, event: 0, cancerType: 'AML', tp53Mutation: false, age: 4 },
  { sample: 'SJAML004', time: 18, event: 1, cancerType: 'AML', tp53Mutation: false, age: 9 },
  { sample: 'SJNBL001', time: 30, event: 0, cancerType: 'Neuroblastoma', tp53Mutation: true, age: 3 },
  { sample: 'SJNBL002', time: 12, event: 1, cancerType: 'Neuroblastoma', tp53Mutation: false, age: 2 },
  { sample: 'SJNBL003', time: 48, event: 0, cancerType: 'Neuroblastoma', tp53Mutation: false, age: 4 },
  { sample: 'SJOS001', time: 18, event: 1, cancerType: 'Osteosarcoma', tp53Mutation: true, age: 14 },
  { sample: 'SJOS002', time: 36, event: 0, cancerType: 'Osteosarcoma', tp53Mutation: false, age: 16 },
  { sample: 'SJOS003', time: 24, event: 1, cancerType: 'Osteosarcoma', tp53Mutation: false, age: 13 }
];

// Sample expression data
export const sampleExpressionData = {
  genes: ['TP53', 'KRAS', 'NOTCH1', 'CDKN2A', 'RB1', 'ALK', 'MYCN', 'FLT3', 'MYC', 'BCL2'],
  samples: ['SJALL001', 'SJALL002', 'SJAML001', 'SJAML002', 'SJNBL001', 'SJNBL002', 'SJOS001', 'SJOS002', 'SJALL003', 'SJAML003'],
  expression: [
    // TP53
    [-0.5, -0.8, -1.2, -0.9, 0.2, 0.5, -0.3, 0.1, 0.4, -0.6],
    // KRAS
    [1.2, 0.8, 0.9, 1.1, 0.3, 0.5, 0.2, 0.4, 1.5, 0.7],
    // NOTCH1
    [2.1, 1.8, 0.3, 0.5, 0.1, 0.2, 0.4, 0.3, 1.9, 0.4],
    // CDKN2A
    [-1.5, -1.2, -0.3, -0.5, 0.2, 0.4, -0.8, -0.6, -1.0, -0.2],
    // RB1
    [0.2, 0.3, 0.5, 0.4, 0.6, 0.5, -1.2, -0.9, 0.3, 0.4],
    // ALK
    [0.1, 0.2, 0.3, 0.2, 2.5, 2.1, 0.4, 0.3, 0.2, 0.3],
    // MYCN
    [0.3, 0.2, 0.4, 0.3, 3.2, 2.8, 0.5, 0.4, 0.3, 0.4],
    // FLT3
    [0.4, 0.5, 1.8, 1.5, 0.3, 0.4, 0.2, 0.3, 0.4, 1.2],
    // MYC
    [1.5, 1.2, 1.8, 1.6, 2.2, 1.9, 1.0, 0.8, 1.4, 1.7],
    // BCL2
    [1.8, 1.5, 0.8, 0.9, 0.4, 0.5, 0.3, 0.4, 1.6, 0.7]
  ]
};
