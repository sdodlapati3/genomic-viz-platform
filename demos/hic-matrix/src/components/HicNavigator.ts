/**
 * Hi-C Multi-View Navigation Component
 *
 * Provides 4-level hierarchical navigation:
 * 1. Genome View - All chromosomes overview
 * 2. ChrPair View - Two-chromosome interaction view
 * 3. Detail View - High-resolution region view
 * 4. Arc/Horizontal View - 1D track representation
 */

import * as d3 from 'd3';

export type HicViewLevel = 'genome' | 'chrpair' | 'detail' | 'horizontal';

export interface HicViewState {
  level: HicViewLevel;
  chrX?: string;
  chrY?: string;
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
  resolution?: number;
}

export interface ChromosomeInfo {
  name: string;
  size: number;
  color: string;
}

export interface HicNavigatorSettings {
  width: number;
  height: number;
  chromosomes: ChromosomeInfo[];
  onNavigate: (state: HicViewState) => void;
}

/**
 * Hi-C Navigator - Multi-level navigation for Hi-C data
 */
export class HicNavigator {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private settings: HicNavigatorSettings;
  private currentState: HicViewState;
  private navigationHistory: HicViewState[] = [];

  constructor(containerId: string, settings: HicNavigatorSettings) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    this.container = container;
    this.settings = settings;

    // Initialize at genome view
    this.currentState = { level: 'genome' };

    // Create SVG
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', settings.width)
      .attr('height', settings.height);

    this.renderNavigation();
    this.renderGenomeView();
  }

  /**
   * Navigate to a specific view
   */
  public navigateTo(state: HicViewState): void {
    this.navigationHistory.push({ ...this.currentState });
    this.currentState = state;
    this.render();
    this.settings.onNavigate(state);
  }

  /**
   * Go back to previous view
   */
  public goBack(): void {
    if (this.navigationHistory.length > 0) {
      this.currentState = this.navigationHistory.pop()!;
      this.render();
      this.settings.onNavigate(this.currentState);
    }
  }

  /**
   * Get current view state
   */
  public getCurrentState(): HicViewState {
    return { ...this.currentState };
  }

  /**
   * Main render function
   */
  private render(): void {
    this.svg.selectAll('.view-content').remove();

    this.renderNavigation();

    switch (this.currentState.level) {
      case 'genome':
        this.renderGenomeView();
        break;
      case 'chrpair':
        this.renderChrPairView();
        break;
      case 'detail':
        this.renderDetailView();
        break;
      case 'horizontal':
        this.renderHorizontalView();
        break;
    }
  }

  /**
   * Render navigation breadcrumb/controls
   */
  private renderNavigation(): void {
    this.svg.selectAll('.navigation').remove();

    const nav = this.svg
      .append('g')
      .attr('class', 'navigation')
      .attr('transform', 'translate(10, 15)');

    const levels: { level: HicViewLevel; label: string }[] = [
      { level: 'genome', label: '🧬 Genome' },
      { level: 'chrpair', label: '🔗 Chr Pair' },
      { level: 'detail', label: '🔍 Detail' },
      { level: 'horizontal', label: '📊 Track' },
    ];

    const currentIndex = levels.findIndex((l) => l.level === this.currentState.level);

    levels.forEach((item, i) => {
      const x = i * 100;
      const isActive = i === currentIndex;
      const isClickable = i < currentIndex;

      const group = nav
        .append('g')
        .attr('transform', `translate(${x}, 0)`)
        .style('cursor', isClickable ? 'pointer' : 'default')
        .on('click', () => {
          if (isClickable) {
            // Navigate back to this level
            while (this.currentState.level !== item.level && this.navigationHistory.length > 0) {
              this.goBack();
            }
          }
        });

      group
        .append('rect')
        .attr('width', 90)
        .attr('height', 24)
        .attr('rx', 4)
        .attr('fill', isActive ? '#3498db' : isClickable ? '#16213e' : '#1a1a2e')
        .attr('stroke', isActive ? '#3498db' : '#0f3460')
        .attr('stroke-width', 1);

      group
        .append('text')
        .attr('x', 45)
        .attr('y', 16)
        .attr('text-anchor', 'middle')
        .attr('fill', isActive ? '#fff' : isClickable ? '#e0e0e0' : '#666')
        .attr('font-size', '11px')
        .text(item.label);

      // Add arrow between levels
      if (i < levels.length - 1) {
        nav
          .append('text')
          .attr('x', x + 95)
          .attr('y', 16)
          .attr('fill', '#666')
          .attr('font-size', '12px')
          .text('→');
      }
    });

    // Current location label
    if (this.currentState.chrX) {
      nav
        .append('text')
        .attr('x', 420)
        .attr('y', 16)
        .attr('fill', '#e0e0e0')
        .attr('font-size', '11px')
        .text(this.getLocationLabel());
    }
  }

  /**
   * Render genome-wide view (all chromosomes)
   */
  private renderGenomeView(): void {
    const { width, height, chromosomes } = this.settings;
    const margin = { top: 50, right: 20, bottom: 20, left: 20 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const content = this.svg
      .append('g')
      .attr('class', 'view-content')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Calculate chromosome positions
    const totalSize = chromosomes.reduce((sum, c) => sum + c.size, 0);
    let cumSize = 0;

    const chrScale = d3.scaleLinear().domain([0, totalSize]).range([0, plotWidth]);

    // Draw chromosome cells as a grid
    const cellSize = Math.min(plotWidth, plotHeight) / chromosomes.length;

    chromosomes.forEach((chrX, i) => {
      chromosomes.forEach((chrY, j) => {
        const x = i * cellSize;
        const y = j * cellSize;

        // Only draw upper triangle (Hi-C is symmetric)
        if (i <= j) {
          const cell = content
            .append('rect')
            .attr('x', x)
            .attr('y', y)
            .attr('width', cellSize - 1)
            .attr('height', cellSize - 1)
            .attr('fill', this.getChrPairColor(chrX.name, chrY.name))
            .attr('rx', 2)
            .style('cursor', 'pointer')
            .on('click', () => {
              this.navigateTo({
                level: 'chrpair',
                chrX: chrX.name,
                chrY: chrY.name,
              });
            })
            .on('mouseover', function () {
              d3.select(this).attr('stroke', '#fff').attr('stroke-width', 2);
            })
            .on('mouseout', function () {
              d3.select(this).attr('stroke', 'none');
            });
        }
      });

      // X-axis labels
      content
        .append('text')
        .attr('x', i * cellSize + cellSize / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e0e0e0')
        .attr('font-size', '9px')
        .text(chrX.name.replace('chr', ''));

      // Y-axis labels
      content
        .append('text')
        .attr('x', -5)
        .attr('y', i * cellSize + cellSize / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#e0e0e0')
        .attr('font-size', '9px')
        .text(chrX.name.replace('chr', ''));
    });

    // Title
    content
      .append('text')
      .attr('x', plotWidth / 2)
      .attr('y', plotHeight + 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#888')
      .attr('font-size', '12px')
      .text('Click a cell to view chromosome pair interactions');
  }

  /**
   * Render chromosome pair view
   */
  private renderChrPairView(): void {
    const { width, height, chromosomes } = this.settings;
    const { chrX, chrY } = this.currentState;

    if (!chrX || !chrY) return;

    const margin = { top: 50, right: 20, bottom: 50, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const content = this.svg
      .append('g')
      .attr('class', 'view-content')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Get chromosome sizes
    const chrXInfo = chromosomes.find((c) => c.name === chrX);
    const chrYInfo = chromosomes.find((c) => c.name === chrY);

    if (!chrXInfo || !chrYInfo) return;

    // Create scales
    const xScale = d3.scaleLinear().domain([0, chrXInfo.size]).range([0, plotWidth]);

    const yScale = d3.scaleLinear().domain([0, chrYInfo.size]).range([0, plotHeight]);

    // Draw a simulated contact matrix (placeholder)
    const numBins = 20;
    const binSizeX = plotWidth / numBins;
    const binSizeY = plotHeight / numBins;

    for (let i = 0; i < numBins; i++) {
      for (let j = 0; j < numBins; j++) {
        // Simulate contact frequency (distance-based decay)
        const distance = Math.abs(i - j);
        const value = Math.exp(-distance * 0.3) * (0.5 + Math.random() * 0.5);

        const cell = content
          .append('rect')
          .attr('x', i * binSizeX)
          .attr('y', j * binSizeY)
          .attr('width', binSizeX - 0.5)
          .attr('height', binSizeY - 0.5)
          .attr('fill', d3.interpolateReds(value))
          .style('cursor', 'pointer')
          .on('click', () => {
            const startX = (i / numBins) * chrXInfo.size;
            const endX = ((i + 1) / numBins) * chrXInfo.size;
            const startY = (j / numBins) * chrYInfo.size;
            const endY = ((j + 1) / numBins) * chrYInfo.size;

            this.navigateTo({
              level: 'detail',
              chrX,
              chrY,
              startX,
              endX,
              startY,
              endY,
              resolution: 10000,
            });
          })
          .on('mouseover', function () {
            d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1);
          })
          .on('mouseout', function () {
            d3.select(this).attr('stroke', 'none');
          });
      }
    }

    // X-axis
    content
      .append('g')
      .attr('transform', `translate(0, ${plotHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickFormat((d) => `${((d as number) / 1e6).toFixed(0)}Mb`)
      )
      .selectAll('text')
      .attr('fill', '#e0e0e0');

    content
      .append('text')
      .attr('x', plotWidth / 2)
      .attr('y', plotHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .text(chrX);

    // Y-axis
    content
      .append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `${((d as number) / 1e6).toFixed(0)}Mb`)
      )
      .selectAll('text')
      .attr('fill', '#e0e0e0');

    content
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -plotHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .text(chrY);
  }

  /**
   * Render detail view (high-resolution)
   */
  private renderDetailView(): void {
    const { width, height } = this.settings;
    const { chrX, chrY, startX, endX, startY, endY } = this.currentState;

    if (!chrX || !chrY || startX === undefined) return;

    const margin = { top: 50, right: 20, bottom: 50, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const content = this.svg
      .append('g')
      .attr('class', 'view-content')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales for the region
    const xScale = d3.scaleLinear().domain([startX!, endX!]).range([0, plotWidth]);

    const yScale = d3.scaleLinear().domain([startY!, endY!]).range([0, plotHeight]);

    // Higher resolution matrix
    const numBins = 40;
    const binSizeX = plotWidth / numBins;
    const binSizeY = plotHeight / numBins;

    for (let i = 0; i < numBins; i++) {
      for (let j = 0; j < numBins; j++) {
        const distance = Math.abs(i - j);
        const value = Math.exp(-distance * 0.15) * (0.3 + Math.random() * 0.7);

        content
          .append('rect')
          .attr('x', i * binSizeX)
          .attr('y', j * binSizeY)
          .attr('width', binSizeX - 0.2)
          .attr('height', binSizeY - 0.2)
          .attr('fill', d3.interpolateReds(value));
      }
    }

    // X-axis
    content
      .append('g')
      .attr('transform', `translate(0, ${plotHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickFormat((d) => `${((d as number) / 1e6).toFixed(2)}Mb`)
      )
      .selectAll('text')
      .attr('fill', '#e0e0e0');

    // Y-axis
    content
      .append('g')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => `${((d as number) / 1e6).toFixed(2)}Mb`)
      )
      .selectAll('text')
      .attr('fill', '#e0e0e0');

    // Add button to switch to horizontal view
    content
      .append('g')
      .attr('transform', `translate(${plotWidth - 100}, ${plotHeight + 35})`)
      .style('cursor', 'pointer')
      .on('click', () => {
        this.navigateTo({
          ...this.currentState,
          level: 'horizontal',
        });
      })
      .call((g) => {
        g.append('rect')
          .attr('width', 100)
          .attr('height', 24)
          .attr('rx', 4)
          .attr('fill', '#16213e')
          .attr('stroke', '#0f3460');
        g.append('text')
          .attr('x', 50)
          .attr('y', 16)
          .attr('text-anchor', 'middle')
          .attr('fill', '#e0e0e0')
          .attr('font-size', '11px')
          .text('📊 Arc View');
      });
  }

  /**
   * Render horizontal/arc view
   */
  private renderHorizontalView(): void {
    const { width, height } = this.settings;
    const { chrX, startX, endX } = this.currentState;

    if (!chrX || startX === undefined) return;

    const margin = { top: 50, right: 20, bottom: 50, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const content = this.svg
      .append('g')
      .attr('class', 'view-content')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear().domain([startX!, endX!]).range([0, plotWidth]);

    // Draw horizontal track
    content
      .append('rect')
      .attr('x', 0)
      .attr('y', plotHeight / 2 - 10)
      .attr('width', plotWidth)
      .attr('height', 20)
      .attr('fill', '#16213e')
      .attr('rx', 4);

    // Draw interaction arcs
    const numArcs = 15;
    const regionSize = endX! - startX!;

    for (let i = 0; i < numArcs; i++) {
      const pos1 = startX! + Math.random() * regionSize * 0.4;
      const pos2 = pos1 + regionSize * 0.1 + Math.random() * regionSize * 0.4;

      const x1 = xScale(pos1);
      const x2 = xScale(pos2);
      const midX = (x1 + x2) / 2;
      const arcHeight = (x2 - x1) * 0.3 + 20;

      const intensity = 0.3 + Math.random() * 0.7;

      const path = `M ${x1} ${plotHeight / 2} 
                    Q ${midX} ${plotHeight / 2 - arcHeight} ${x2} ${plotHeight / 2}`;

      content
        .append('path')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', d3.interpolateReds(intensity))
        .attr('stroke-width', 2 + intensity * 3)
        .attr('opacity', 0.7);
    }

    // X-axis
    content
      .append('g')
      .attr('transform', `translate(0, ${plotHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(8)
          .tickFormat((d) => `${((d as number) / 1e6).toFixed(2)}Mb`)
      )
      .selectAll('text')
      .attr('fill', '#e0e0e0');

    content
      .append('text')
      .attr('x', plotWidth / 2)
      .attr('y', plotHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .text(`${chrX} (Arc View)`);

    // Legend
    content
      .append('text')
      .attr('x', 0)
      .attr('y', -10)
      .attr('fill', '#888')
      .attr('font-size', '11px')
      .text('Arc height = interaction distance, Color intensity = contact frequency');
  }

  /**
   * Get color for chromosome pair cell
   */
  private getChrPairColor(chrX: string, chrY: string): string {
    // Simulate some interaction signal
    const chrNum1 = parseInt(chrX.replace('chr', '')) || 23;
    const chrNum2 = parseInt(chrY.replace('chr', '')) || 23;

    // Intra-chromosomal has higher signal
    if (chrX === chrY) {
      return d3.interpolateReds(0.7 + Math.random() * 0.3);
    }

    // Inter-chromosomal
    const distance = Math.abs(chrNum1 - chrNum2);
    const value = Math.exp(-distance * 0.1) * 0.5;
    return d3.interpolateReds(value);
  }

  /**
   * Get location label for current view
   */
  private getLocationLabel(): string {
    const { level, chrX, chrY, startX, endX } = this.currentState;

    switch (level) {
      case 'chrpair':
        return `${chrX} × ${chrY}`;
      case 'detail':
      case 'horizontal':
        return `${chrX}:${((startX || 0) / 1e6).toFixed(1)}-${((endX || 0) / 1e6).toFixed(1)}Mb`;
      default:
        return '';
    }
  }
}

/**
 * CSS styles for Hi-C Navigator
 */
export const hicNavigatorStyles = `
  .hic-navigator {
    background: #1a1a2e;
    border-radius: 8px;
    padding: 1rem;
  }
  
  .hic-navigator svg {
    display: block;
  }
  
  .hic-navigator text {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .hic-navigator .axis path,
  .hic-navigator .axis line {
    stroke: #444;
  }
`;
