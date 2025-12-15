/**
 * Protein Panel Component
 *
 * Main container component that orchestrates all protein visualization elements
 */

import * as d3 from 'd3';
import type { Protein, ProteinDomain, Mutation, FusionBreakpoint } from '../types';
import { ProteinScale, createProteinScale } from '../scales/proteinScale';
import { ProteinAxis } from './ProteinAxis';
import { DomainTrack } from './DomainTrack';
import { LollipopTrack } from './LollipopTrack';
import { MutationTooltip } from './MutationTooltip';

/**
 * Configuration for the protein panel
 */
export interface ProteinPanelConfig {
  /** Container element or selector */
  container: string | HTMLElement;
  /** Protein data */
  protein: Protein;
  /** Domain annotations */
  domains: ProteinDomain[];
  /** Mutation data */
  mutations: Mutation[];
  /** Fusion breakpoints */
  fusions?: FusionBreakpoint[];

  /** Dimension options */
  dimensions?: {
    width?: number;
    height?: number;
    margin?: { top: number; right: number; bottom: number; left: number };
  };

  /** Style options */
  style?: {
    domainHeight?: number;
    lollipopMaxHeight?: number;
    lollipopMinHeight?: number;
    backgroundColor?: string;
  };

  /** Interaction callbacks */
  interactions?: {
    onMutationClick?: (mutation: Mutation) => void;
    onMutationHover?: (mutation: Mutation | null) => void;
    onDomainClick?: (domain: ProteinDomain) => void;
    onDomainHover?: (domain: ProteinDomain | null) => void;
    onBrushSelect?: (range: [number, number] | null) => void;
  };

  /** Feature flags */
  features?: {
    showLegend?: boolean;
    showAxis?: boolean;
    showDomainLabels?: boolean;
    enableBrush?: boolean;
    enableZoom?: boolean;
  };
}

/**
 * Main Protein Panel class
 */
export class ProteinPanel {
  private container: HTMLElement;
  private config: Required<ProteinPanelConfig>;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private scale!: ProteinScale;

  // Child components
  private axis: ProteinAxis | null = null;
  private domainTrack: DomainTrack | null = null;
  private lollipopTrack: LollipopTrack | null = null;
  private tooltip: MutationTooltip | null = null;

  // Groups
  private mainGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private lollipopGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private domainGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private axisGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private legendGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(config: ProteinPanelConfig) {
    // Resolve container
    this.container =
      typeof config.container === 'string'
        ? (document.querySelector(config.container) as HTMLElement)
        : config.container;

    if (!this.container) {
      throw new Error('Container element not found');
    }

    // Merge with defaults
    this.config = this.mergeDefaults(config);

    // Initialize
    this.init();
    this.render();
  }

  private mergeDefaults(config: ProteinPanelConfig): Required<ProteinPanelConfig> {
    return {
      ...config,
      fusions: config.fusions || [],
      dimensions: {
        width: config.dimensions?.width || 900,
        height: config.dimensions?.height || 300,
        margin: config.dimensions?.margin || { top: 60, right: 30, bottom: 50, left: 60 },
      },
      style: {
        domainHeight: config.style?.domainHeight || 35,
        lollipopMaxHeight: config.style?.lollipopMaxHeight || 120,
        lollipopMinHeight: config.style?.lollipopMinHeight || 30,
        backgroundColor: config.style?.backgroundColor || '#ffffff',
      },
      interactions: config.interactions || {},
      features: {
        showLegend: config.features?.showLegend !== false,
        showAxis: config.features?.showAxis !== false,
        showDomainLabels: config.features?.showDomainLabels !== false,
        enableBrush: config.features?.enableBrush || false,
        enableZoom: config.features?.enableZoom || false,
      },
    };
  }

  private init(): void {
    const { width, height, margin } = this.config.dimensions;

    // Clear container
    this.container.innerHTML = '';

    // Create SVG
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('class', 'protein-panel')
      .attr('width', width)
      .attr('height', height)
      .style('background', this.config.style.backgroundColor)
      .style('font-family', 'system-ui, -apple-system, sans-serif');

    // Create main group with margins
    this.mainGroup = this.svg
      .append('g')
      .attr('class', 'main-group')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scale
    const innerWidth = width - margin.left - margin.right;
    this.scale = createProteinScale(this.config.protein.length, innerWidth, { left: 0, right: 0 });

    // Create groups for layers
    this.lollipopGroup = this.mainGroup.append('g').attr('class', 'lollipop-layer');
    this.domainGroup = this.mainGroup.append('g').attr('class', 'domain-layer');
    this.axisGroup = this.mainGroup.append('g').attr('class', 'axis-layer');
    this.legendGroup = this.svg.append('g').attr('class', 'legend-layer');

    // Create tooltip
    this.tooltip = new MutationTooltip({ showExtendedInfo: true });
  }

  private render(): void {
    const { domainHeight, lollipopMaxHeight } = this.config.style;
    const { margin } = this.config.dimensions;

    // Position layers
    const domainY = lollipopMaxHeight + 20;
    const axisY = domainY + domainHeight + 10;

    this.domainGroup.attr('transform', `translate(0, ${domainY})`);
    this.axisGroup.attr('transform', `translate(0, ${axisY})`);
    this.lollipopGroup.attr('transform', `translate(0, ${lollipopMaxHeight})`);

    // Render axis
    if (this.config.features.showAxis) {
      this.axis = new ProteinAxis({
        container: this.axisGroup.node()!,
        scale: this.scale,
        protein: this.config.protein,
        showLabel: true,
      });
    }

    // Render domain track
    this.domainTrack = new DomainTrack({
      container: this.domainGroup.node()!,
      scale: this.scale,
      domains: this.config.domains,
      height: domainHeight,
      showLabels: this.config.features.showDomainLabels,
      onDomainClick: this.config.interactions.onDomainClick,
      onDomainHover: this.config.interactions.onDomainHover,
    });

    // Render lollipop track
    this.lollipopTrack = new LollipopTrack({
      container: this.lollipopGroup.node()!,
      scale: this.scale,
      mutations: this.config.mutations,
      fusions: this.config.fusions,
      maxHeight: lollipopMaxHeight,
      minHeight: this.config.style.lollipopMinHeight,
      onMutationClick: this.config.interactions.onMutationClick,
      onMutationHover: this.config.interactions.onMutationHover,
    });

    // Render legend
    if (this.config.features.showLegend) {
      this.renderLegend();
    }
  }

  private renderLegend(): void {
    const { width, margin } = this.config.dimensions;

    this.legendGroup.attr('transform', `translate(${margin.left}, ${margin.top - 40})`);

    const legendItems = [
      { label: 'Missense', color: '#3498DB', shape: 'circle' },
      { label: 'Nonsense', color: '#E74C3C', shape: 'square' },
      { label: 'Frameshift', color: '#9B59B6', shape: 'diamond' },
      { label: 'Splice', color: '#F39C12', shape: 'triangle' },
      { label: 'Germline', color: '#27AE60', shape: 'arc' },
    ];

    let xOffset = 0;

    legendItems.forEach((item) => {
      const itemGroup = this.legendGroup
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', `translate(${xOffset}, 0)`);

      // Shape
      if (item.shape === 'circle') {
        itemGroup
          .append('circle')
          .attr('cx', 6)
          .attr('cy', 0)
          .attr('r', 5)
          .attr('fill', item.color);
      } else if (item.shape === 'square') {
        itemGroup
          .append('rect')
          .attr('x', 1)
          .attr('y', -5)
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', item.color);
      } else if (item.shape === 'diamond') {
        itemGroup.append('path').attr('d', 'M6 -6 L12 0 L6 6 L0 0 Z').attr('fill', item.color);
      } else if (item.shape === 'triangle') {
        itemGroup.append('path').attr('d', 'M6 -6 L12 4 L0 4 Z').attr('fill', item.color);
      } else if (item.shape === 'arc') {
        itemGroup
          .append('path')
          .attr('d', 'M0 0 A6 6 0 0 1 12 0')
          .attr('fill', 'none')
          .attr('stroke', item.color)
          .attr('stroke-width', 2.5);
      }

      // Label
      itemGroup
        .append('text')
        .attr('x', 18)
        .attr('y', 4)
        .attr('font-size', '11px')
        .attr('fill', '#666')
        .text(item.label);

      xOffset += item.label.length * 7 + 35;
    });
  }

  // Public API

  /**
   * Update mutations
   */
  updateMutations(mutations: Mutation[]): void {
    this.config.mutations = mutations;
    this.lollipopTrack?.update(mutations);
  }

  /**
   * Highlight a specific mutation
   */
  highlightMutation(mutationId: string): void {
    this.lollipopTrack?.highlightMutation(mutationId);
  }

  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    this.lollipopTrack?.clearHighlights();
    this.domainTrack?.clearHighlights();
  }

  /**
   * Zoom to a region
   */
  zoomTo(start: number, end: number): void {
    this.scale.zoomTo(start, end);
    this.axis?.update(this.scale);
    this.domainTrack?.updateScale(this.scale);
    this.lollipopTrack?.updateScale(this.scale);
  }

  /**
   * Reset zoom to full view
   */
  resetZoom(): void {
    this.scale.reset();
    this.axis?.update(this.scale);
    this.domainTrack?.updateScale(this.scale);
    this.lollipopTrack?.updateScale(this.scale);
  }

  /**
   * Filter mutations by consequence type
   */
  filterByConsequence(types: string[]): void {
    this.lollipopTrack?.filterByConsequence(types);
  }

  /**
   * Get current zoom level
   */
  getZoomLevel(): number {
    return this.scale.getZoomLevel();
  }

  /**
   * Export as SVG
   */
  exportSVG(): string {
    const svgNode = this.svg.node();
    if (!svgNode) return '';

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgNode);
  }

  /**
   * Resize the panel
   */
  resize(width: number, height: number): void {
    this.config.dimensions.width = width;
    this.config.dimensions.height = height;
    this.init();
    this.render();
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.tooltip?.destroy();
    this.domainTrack?.destroy();
    this.lollipopTrack?.destroy();
    this.svg.remove();
    this.container.innerHTML = '';
  }
}
