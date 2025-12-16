/**
 * GSEA (Gene Set Enrichment Analysis) Types
 */

export interface Gene {
  symbol: string;
  rank: number;
  score: number; // Signal-to-noise ratio or log fold change
  inGeneSet: boolean;
}

export interface GseaResult {
  geneSetName: string;
  geneSetSize: number;
  enrichmentScore: number;
  normalizedEnrichmentScore: number;
  nominalPValue: number;
  fdrQValue: number;
  fwerPValue: number;
  leadingEdgeSize: number;
  rankedList: Gene[];
  runningSum: number[];
  maxEsPosition: number;
}

export interface GseaSettings {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  mainPlotHeight: number; // Height of the running sum plot
  hitPlotHeight: number; // Height of the gene hit markers
  rankPlotHeight: number; // Height of the ranked metric plot
}
