import type { MutationClass } from '../types';

/**
 * Color schemes for different mutation classes
 * Based on ProteinPaint color conventions
 */
export const MUTATION_COLORS: Record<MutationClass, string> = {
  missense: '#3987cc', // Blue
  nonsense: '#e6194b', // Red
  frameshift: '#f58231', // Orange
  splice: '#911eb4', // Purple
  inframe: '#46f0f0', // Cyan
  silent: '#999999', // Gray
  utr_5: '#f032e6', // Pink
  utr_3: '#f032e6', // Pink
  intron: '#bcf60c', // Lime
  other: '#808080', // Dark gray
};

/**
 * CNV colors
 */
export const CNV_COLORS = {
  gain: '#e74c3c', // Red for amplification
  loss: '#3498db', // Blue for deletion
  neutral: '#555', // Gray for no change
};

/**
 * LOH (Loss of Heterozygosity) colors
 */
export const LOH_COLORS = {
  loh: '#9b59b6', // Purple for LOH
  cnloh: '#8e44ad', // Dark purple for copy-neutral LOH
  normal: '#2ecc71', // Green for heterozygous (normal)
};

/**
 * Fusion chord colors - generate random but consistent colors
 */
export function getFusionColor(geneA: string, geneB: string): string {
  const fusionColors = [
    '#e74c3c',
    '#9b59b6',
    '#3498db',
    '#1abc9c',
    '#2ecc71',
    '#f39c12',
    '#e91e63',
    '#00bcd4',
  ];

  // Hash the gene pair to get consistent color
  const hash = (geneA + geneB).split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return fusionColors[Math.abs(hash) % fusionColors.length];
}

/**
 * Get mutation class label
 */
export function getMutationLabel(mutClass: MutationClass): string {
  const labels: Record<MutationClass, string> = {
    missense: 'Missense',
    nonsense: 'Nonsense',
    frameshift: 'Frameshift',
    splice: 'Splice site',
    inframe: 'In-frame indel',
    silent: 'Silent',
    utr_5: "5' UTR",
    utr_3: "3' UTR",
    intron: 'Intronic',
    other: 'Other',
  };
  return labels[mutClass] || mutClass;
}

/**
 * Format large numbers with commas
 */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/**
 * Format genomic position
 */
export function formatPosition(chr: string, pos: number): string {
  return `${chr}:${formatNumber(pos)}`;
}

/**
 * Format genomic range
 */
export function formatRange(chr: string, start: number, end: number): string {
  return `${chr}:${formatNumber(start)}-${formatNumber(end)}`;
}
