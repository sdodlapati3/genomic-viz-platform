/**
 * Visualization Types
 * Type definitions for chart configurations and rendering
 */

// =============================================================================
// Common Chart Types
// =============================================================================

export interface ChartDimensions {
  /** Total width including margins */
  width: number;
  /** Total height including margins */
  height: number;
  /** Margin configuration */
  margin: Margin;
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartConfig extends ChartDimensions {
  /** Chart title */
  title?: string;
  /** X-axis label */
  xLabel?: string;
  /** Y-axis label */
  yLabel?: string;
  /** Color scheme */
  colorScheme?: string | string[];
  /** Animation duration (ms) */
  animationDuration?: number;
  /** Enable tooltips */
  showTooltips?: boolean;
  /** Enable legend */
  showLegend?: boolean;
  /** Legend position */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
}

// =============================================================================
// Scale Types
// =============================================================================

export interface ScaleConfig {
  /** Scale type */
  type: ScaleType;
  /** Domain (input range) */
  domain?: [number, number] | string[];
  /** Range (output range) */
  range?: [number, number];
  /** Nice rounding */
  nice?: boolean;
  /** Clamp values to range */
  clamp?: boolean;
}

export type ScaleType =
  | 'linear'
  | 'log'
  | 'sqrt'
  | 'pow'
  | 'time'
  | 'band'
  | 'point'
  | 'ordinal';

// =============================================================================
// Axis Types
// =============================================================================

export interface AxisConfig {
  /** Show axis */
  show: boolean;
  /** Axis label */
  label?: string;
  /** Tick count (approximate) */
  tickCount?: number;
  /** Custom tick values */
  tickValues?: number[] | string[];
  /** Tick format function name or d3 format string */
  tickFormat?: string;
  /** Tick size */
  tickSize?: number;
  /** Grid lines */
  showGrid?: boolean;
}

// =============================================================================
// Color Types
// =============================================================================

export interface ColorScale {
  /** Scale type */
  type: 'sequential' | 'diverging' | 'categorical';
  /** Color scheme name or array of colors */
  scheme: string | string[];
  /** Domain for continuous scales */
  domain?: [number, number] | [number, number, number];
  /** Unknown value color */
  unknown?: string;
}

export interface ColorMapping {
  /** Value to color mapping */
  [key: string]: string;
}

/** Common genomic color schemes */
export const MUTATION_COLORS: ColorMapping = {
  missense: '#2E8B57',      // Sea green
  nonsense: '#DC143C',      // Crimson
  frameshift: '#9400D3',    // Dark violet
  splice: '#FF8C00',        // Dark orange
  silent: '#808080',        // Gray
  inframe_indel: '#4169E1', // Royal blue
  other: '#A9A9A9',         // Dark gray
};

export const VARIANT_IMPACT_COLORS: ColorMapping = {
  HIGH: '#DC143C',
  MODERATE: '#FF8C00',
  LOW: '#2E8B57',
  MODIFIER: '#808080',
};

// =============================================================================
// Tooltip Types
// =============================================================================

export interface TooltipConfig {
  /** Enable tooltips */
  enabled: boolean;
  /** Tooltip offset from cursor */
  offset?: { x: number; y: number };
  /** Custom HTML template */
  template?: string;
  /** Show delay (ms) */
  showDelay?: number;
  /** Hide delay (ms) */
  hideDelay?: number;
}

export interface TooltipData {
  /** Tooltip title */
  title?: string;
  /** Key-value pairs to display */
  fields: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  /** Position */
  position: { x: number; y: number };
}

// =============================================================================
// Lollipop Plot Types
// =============================================================================

export interface LollipopConfig extends ChartConfig {
  /** Protein length (amino acids) */
  proteinLength: number;
  /** Domain track height */
  domainHeight?: number;
  /** Lollipop stem height range */
  stemHeightRange?: [number, number];
  /** Lollipop head radius range */
  headRadiusRange?: [number, number];
  /** Color by field */
  colorBy?: 'mutationType' | 'consequence' | 'custom';
  /** Custom color mapping */
  colors?: ColorMapping;
  /** Show frequency on y-axis */
  showFrequency?: boolean;
}

export interface LollipopData {
  /** Protein position (amino acid) */
  position: number;
  /** Amino acid change (e.g., "R175H") */
  aaChange?: string;
  /** Mutation type */
  type: string;
  /** Mutation count/frequency */
  count: number;
  /** Sample IDs with this mutation */
  samples?: string[];
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Scatter Plot Types
// =============================================================================

export interface ScatterConfig extends ChartConfig {
  /** X-axis scale config */
  xScale?: ScaleConfig;
  /** Y-axis scale config */
  yScale?: ScaleConfig;
  /** Point radius */
  pointRadius?: number;
  /** Point opacity */
  pointOpacity?: number;
  /** Enable zoom */
  zoomEnabled?: boolean;
  /** Enable brush selection */
  brushEnabled?: boolean;
  /** Enable lasso selection */
  lassoEnabled?: boolean;
}

export interface ScatterPoint {
  /** X coordinate value */
  x: number;
  /** Y coordinate value */
  y: number;
  /** Point identifier */
  id?: string;
  /** Point label */
  label?: string;
  /** Category for coloring */
  category?: string;
  /** Size value */
  size?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Heatmap Types
// =============================================================================

export interface HeatmapConfig extends ChartConfig {
  /** Cell width */
  cellWidth?: number;
  /** Cell height */
  cellHeight?: number;
  /** Color scale */
  colorScale?: ColorScale;
  /** Show row dendrogram */
  showRowDendrogram?: boolean;
  /** Show column dendrogram */
  showColDendrogram?: boolean;
  /** Row clustering method */
  rowClusterMethod?: ClusterMethod;
  /** Column clustering method */
  colClusterMethod?: ClusterMethod;
  /** Distance metric */
  distanceMetric?: DistanceMetric;
}

export type ClusterMethod = 'single' | 'complete' | 'average' | 'ward';
export type DistanceMetric = 'euclidean' | 'manhattan' | 'correlation' | 'cosine';

export interface HeatmapData {
  /** Row labels */
  rowLabels: string[];
  /** Column labels */
  colLabels: string[];
  /** Values matrix */
  values: number[][];
  /** Row annotations */
  rowAnnotations?: Record<string, string[]>;
  /** Column annotations */
  colAnnotations?: Record<string, string[]>;
}

// =============================================================================
// Genome Browser Types
// =============================================================================

export interface GenomeBrowserConfig extends ChartConfig {
  /** Reference genome */
  genome: 'hg19' | 'hg38';
  /** Initial chromosome */
  chromosome: string;
  /** Initial start position */
  start: number;
  /** Initial end position */
  end: number;
  /** Track configurations */
  tracks: TrackConfig[];
}

export interface TrackConfig {
  /** Track type */
  type: TrackType;
  /** Track name */
  name: string;
  /** Track height */
  height: number;
  /** Data source URL or data */
  data: string | unknown[];
  /** Track-specific options */
  options?: Record<string, unknown>;
}

export type TrackType =
  | 'gene'
  | 'variant'
  | 'quantitative'
  | 'annotation'
  | 'alignment'
  | 'arc';

// =============================================================================
// Event Types
// =============================================================================

export interface ChartEvent<T = unknown> {
  /** Event type */
  type: 'click' | 'hover' | 'select' | 'brush' | 'zoom';
  /** Event data */
  data: T;
  /** Mouse/touch position */
  position?: { x: number; y: number };
  /** Selected items (for selection events) */
  selection?: T[];
}

export type ChartEventHandler<T = unknown> = (event: ChartEvent<T>) => void;
