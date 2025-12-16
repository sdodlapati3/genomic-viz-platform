import * as d3 from 'd3';
import type {
  SampleData,
  DiscoSettings,
  GenomeReference,
  Chromosome,
  SnvArc,
  CnvArc,
  FusionChord,
  MutationClass,
} from '../types';
import { Reference } from '../core/Reference';
import { SnvArcMapper, CnvArcMapper, FusionChordMapper } from '../core/ArcMappers';
import { MUTATION_COLORS, getMutationLabel, formatPosition, formatRange } from '../core/Colors';

/**
 * Main Disco/Circos diagram component
 */
export class DiscoDiagram {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private mainGroup: d3.Selection<SVGGElement, unknown, null, undefined>;
  private tooltip: HTMLElement;
  private infoPanel: HTMLElement;

  private genome: GenomeReference;
  private sampleData: SampleData | null = null;
  private settings: DiscoSettings;
  private reference: Reference;

  // Mapped data
  private snvArcs: SnvArc[] = [];
  private cnvArcs: CnvArc[] = [];
  private fusionChords: FusionChord[] = [];

  constructor(containerId: string, genome: GenomeReference, settings: DiscoSettings) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    this.container = container;
    this.genome = genome;
    this.settings = settings;
    this.reference = new Reference(genome, settings);

    // Get tooltip element
    this.tooltip = document.getElementById('tooltip') || this.createTooltip();
    this.infoPanel = document.getElementById('info-content') || document.createElement('div');

    // Create SVG
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', settings.radius * 2 + 100)
      .attr('height', settings.radius * 2 + 100);

    this.mainGroup = this.svg
      .append('g')
      .attr('transform', `translate(${settings.radius + 50}, ${settings.radius + 50})`);

    // Initial render with just chromosomes
    this.render();
  }

  private createTooltip(): HTMLElement {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.id = 'tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  /**
   * Load sample data and render
   */
  public loadData(data: SampleData): void {
    this.sampleData = data;
    this.processData();
    this.render();
    this.updateInfoPanel();
  }

  /**
   * Process data into renderable arcs and chords
   */
  private processData(): void {
    if (!this.sampleData) return;

    const snvMapper = new SnvArcMapper(this.reference, this.settings);
    const cnvMapper = new CnvArcMapper(this.reference, this.settings);
    const fusionMapper = new FusionChordMapper(this.reference, this.settings);

    this.snvArcs = snvMapper.map(this.sampleData.mutations);
    this.cnvArcs = cnvMapper.map(this.sampleData.cnv);
    this.fusionChords = fusionMapper.map(this.sampleData.fusions);
  }

  /**
   * Main render function
   */
  public render(): void {
    // Clear existing
    this.mainGroup.selectAll('*').remove();

    // Create groups in drawing order (back to front)
    const fusionsGroup = this.mainGroup.append('g').attr('class', 'fusions-layer');
    const trackBgGroup = this.mainGroup.append('g').attr('class', 'track-bg-layer');
    const cnvGroup = this.mainGroup.append('g').attr('class', 'cnv-layer');
    const snvGroup = this.mainGroup.append('g').attr('class', 'snv-layer');
    const chromosomeGroup = this.mainGroup.append('g').attr('class', 'chromosome-layer');
    const labelsGroup = this.mainGroup.append('g').attr('class', 'labels-layer');

    // Render background track rings first (containers for data)
    this.renderTrackBackgrounds(trackBgGroup);

    // Render each layer
    this.renderChromosomes(chromosomeGroup);

    if (this.settings.showLabels) {
      this.renderLabels(labelsGroup);
    }

    if (this.settings.showSnv && this.snvArcs.length > 0) {
      this.renderSnvRing(snvGroup);
    }

    if (this.settings.showCnv && this.cnvArcs.length > 0) {
      this.renderCnvRing(cnvGroup);
    }

    if (this.settings.showFusions && this.fusionChords.length > 0) {
      this.renderFusionChords(fusionsGroup);
    }

    // Add center text
    this.renderCenterText();
  }

  /**
   * Render background track rings (containers for SNV and CNV data)
   */
  private renderTrackBackgrounds(group: d3.Selection<SVGGElement, unknown, null, undefined>): void {
    const snvMapper = new SnvArcMapper(this.reference, this.settings);
    const cnvMapper = new CnvArcMapper(this.reference, this.settings);

    // SNV track background (light gray ring)
    if (this.settings.showSnv) {
      group
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', (snvMapper.getInnerRadius() + snvMapper.getOuterRadius()) / 2)
        .attr('fill', 'none')
        .attr('stroke', '#e8e8e8')
        .attr('stroke-width', snvMapper.getOuterRadius() - snvMapper.getInnerRadius())
        .attr('opacity', 0.8);
    }

    // CNV track background (slightly different shade)
    if (this.settings.showCnv) {
      group
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', (cnvMapper.getInnerRadius() + cnvMapper.getOuterRadius()) / 2)
        .attr('fill', 'none')
        .attr('stroke', '#f0f0f0')
        .attr('stroke-width', cnvMapper.getOuterRadius() - cnvMapper.getInnerRadius())
        .attr('opacity', 0.8);
    }

    // Add track labels on the right side
    const labelX = this.settings.radius + 20;

    if (this.settings.showSnv) {
      const snvMidRadius = (snvMapper.getInnerRadius() + snvMapper.getOuterRadius()) / 2;
      group
        .append('text')
        .attr('x', labelX)
        .attr('y', -snvMidRadius + 4)
        .attr('class', 'track-label')
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text('SNV');
    }

    if (this.settings.showCnv) {
      const cnvMidRadius = (cnvMapper.getInnerRadius() + cnvMapper.getOuterRadius()) / 2;
      group
        .append('text')
        .attr('x', labelX)
        .attr('y', -cnvMidRadius + 4)
        .attr('class', 'track-label')
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text('CNV');
    }
  }

  /**
   * Render chromosome ring (outer ring)
   */
  private renderChromosomes(group: d3.Selection<SVGGElement, unknown, null, undefined>): void {
    const arc = d3
      .arc<Chromosome>()
      .innerRadius((d) => d.innerRadius)
      .outerRadius((d) => d.outerRadius)
      .startAngle((d) => d.startAngle)
      .endAngle((d) => d.endAngle);

    group
      .selectAll('path.chromosome-arc')
      .data(this.reference.chromosomes)
      .join('path')
      .attr('class', 'chromosome-arc')
      .attr('d', arc)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#444')
      .attr('stroke-width', 0.5)
      .on('mouseover', (event, d) => {
        this.showTooltip(
          event,
          `
          <div class="tooltip-title">${d.name}</div>
          <div class="tooltip-row">
            <span class="tooltip-label">Size:</span>
            <span class="tooltip-value">${(d.size / 1e6).toFixed(1)} Mb</span>
          </div>
        `
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseout', () => this.hideTooltip());
  }

  /**
   * Render chromosome labels (INSIDE the ring)
   */
  private renderLabels(group: d3.Selection<SVGGElement, unknown, null, undefined>): void {
    // Labels inside the chromosome ring
    const chrInnerRadius =
      this.settings.radius -
      this.settings.cnvRingWidth -
      this.settings.snvRingWidth -
      this.settings.chromosomeWidth;
    const labelRadius = chrInnerRadius - 12;

    group
      .selectAll('text.chromosome-label')
      .data(this.reference.chromosomes)
      .join('text')
      .attr('class', 'chromosome-label')
      .attr('transform', (d) => {
        const x = Math.sin(d.angle) * labelRadius;
        const y = -Math.cos(d.angle) * labelRadius;
        // Rotate text to follow circle
        let rotation = (d.angle * 180) / Math.PI;
        // Flip text on bottom half for readability
        if (d.angle > Math.PI) {
          rotation += 180;
        }
        return `translate(${x}, ${y}) rotate(${rotation})`;
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '9px')
      .text((d) => d.text || '');
  }

  /**
   * Render SNV/mutation ring
   */
  private renderSnvRing(group: d3.Selection<SVGGElement, unknown, null, undefined>): void {
    const arc = d3
      .arc<SnvArc>()
      .innerRadius((d) => d.innerRadius)
      .outerRadius((d) => d.outerRadius)
      .startAngle((d) => d.startAngle)
      .endAngle((d) => d.endAngle);

    group
      .selectAll('path.snv-arc')
      .data(this.snvArcs)
      .join('path')
      .attr('class', 'snv-arc')
      .attr('d', arc)
      .attr('fill', (d) => d.color)
      .on('mouseover', (event, d) => {
        this.showTooltip(
          event,
          `
          <div class="tooltip-title">${d.gene}</div>
          <div class="tooltip-row">
            <span class="tooltip-label">Position:</span>
            <span class="tooltip-value">${formatPosition(d.chr, d.pos)}</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Class:</span>
            <span class="tooltip-value">${getMutationLabel(d.mutClass)}</span>
          </div>
          ${
            d.mname
              ? `
          <div class="tooltip-row">
            <span class="tooltip-label">Mutation:</span>
            <span class="tooltip-value">${d.mname}</span>
          </div>
          `
              : ''
          }
        `
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseout', () => this.hideTooltip());
  }

  /**
   * Render CNV ring
   */
  private renderCnvRing(group: d3.Selection<SVGGElement, unknown, null, undefined>): void {
    const arc = d3
      .arc<CnvArc>()
      .innerRadius((d) => d.innerRadius)
      .outerRadius((d) => d.outerRadius)
      .startAngle((d) => d.startAngle)
      .endAngle((d) => d.endAngle);

    group
      .selectAll('path.cnv-arc')
      .data(this.cnvArcs)
      .join('path')
      .attr('class', 'cnv-arc')
      .attr('d', arc)
      .attr('fill', (d) => d.color)
      .on('mouseover', (event, d) => {
        this.showTooltip(
          event,
          `
          <div class="tooltip-title">Copy Number ${d.type === 'gain' ? 'Gain' : 'Loss'}</div>
          <div class="tooltip-row">
            <span class="tooltip-label">Region:</span>
            <span class="tooltip-value">${formatRange(d.chr, d.start, d.end)}</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Log2 Ratio:</span>
            <span class="tooltip-value">${d.value > 0 ? '+' : ''}${d.value.toFixed(2)}</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Size:</span>
            <span class="tooltip-value">${((d.end - d.start) / 1e6).toFixed(2)} Mb</span>
          </div>
        `
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseout', () => this.hideTooltip());
  }

  /**
   * Render fusion chords (bezier curves connecting two chromosomes)
   */
  private renderFusionChords(group: d3.Selection<SVGGElement, unknown, null, undefined>): void {
    const fusionMapper = new FusionChordMapper(this.reference, this.settings);
    const controlRadius = fusionMapper.getInnerRadius(); // Inner radius for bezier control
    const chordRadius = fusionMapper.getChromosomeInnerRadius(); // Chords touch chromosomes

    // Create custom chord generator
    const chordLine = (chord: FusionChord) => {
      const sourceAngle = (chord.source.startAngle + chord.source.endAngle) / 2;
      const targetAngle = (chord.target.startAngle + chord.target.endAngle) / 2;

      // Start and end points touch the chromosome ring
      const sx = Math.sin(sourceAngle) * chordRadius;
      const sy = -Math.cos(sourceAngle) * chordRadius;
      const tx = Math.sin(targetAngle) * chordRadius;
      const ty = -Math.cos(targetAngle) * chordRadius;

      // Control points for bezier curve (towards center for smooth arc)
      const cx1 = Math.sin(sourceAngle) * controlRadius;
      const cy1 = -Math.cos(sourceAngle) * controlRadius;
      const cx2 = Math.sin(targetAngle) * controlRadius;
      const cy2 = -Math.cos(targetAngle) * controlRadius;

      return `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
    };

    // Draw the chord lines
    group
      .selectAll('path.fusion-chord')
      .data(this.fusionChords)
      .join('path')
      .attr('class', 'fusion-chord')
      .attr('d', chordLine)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8)
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('stroke-opacity', 1).attr('stroke-width', 4);
        this.showTooltip(
          event,
          `
          <div class="tooltip-title">Fusion: ${d.geneA}-${d.geneB}</div>
          <div class="tooltip-row">
            <span class="tooltip-label">Partner A:</span>
            <span class="tooltip-value">${d.geneA} (${d.chrA}:${(d.posA / 1e6).toFixed(1)}Mb)</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Partner B:</span>
            <span class="tooltip-value">${d.geneB} (${d.chrB}:${(d.posB / 1e6).toFixed(1)}Mb)</span>
          </div>
        `
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).attr('stroke-opacity', 0.8).attr('stroke-width', 2);
        this.hideTooltip();
      });
  }

  /**
   * Render center text (sample name)
   */
  private renderCenterText(): void {
    const sampleName = this.sampleData?.sample || 'No data';

    this.mainGroup
      .append('text')
      .attr('class', 'center-text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#888')
      .attr('font-size', '14px')
      .text(sampleName);
  }

  /**
   * Update info panel with summary
   */
  private updateInfoPanel(): void {
    if (!this.sampleData) {
      this.infoPanel.innerHTML = '<p class="placeholder">No data loaded</p>';
      return;
    }

    const mutationsByClass = this.groupMutationsByClass();

    this.infoPanel.innerHTML = `
      <div class="info-section">
        <div class="info-section-title">Sample</div>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${this.sampleData.sample}</span>
        </div>
      </div>

      <div class="info-section">
        <div class="info-section-title">Summary</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${this.sampleData.mutations.length}</div>
            <div class="stat-label">Mutations</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.sampleData.cnv.length}</div>
            <div class="stat-label">CNVs</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.sampleData.fusions.length}</div>
            <div class="stat-label">Fusions</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.countAffectedChromosomes()}</div>
            <div class="stat-label">Affected Chr</div>
          </div>
        </div>
      </div>

      <div class="info-section">
        <div class="info-section-title">Mutation Types</div>
        ${Array.from(mutationsByClass.entries())
          .sort((a, b) => b[1] - a[1])
          .map(
            ([cls, count]) => `
            <div class="info-row">
              <span class="info-label" style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 10px; height: 10px; background: ${MUTATION_COLORS[cls as MutationClass]}; border-radius: 2px;"></span>
                ${getMutationLabel(cls as MutationClass)}
              </span>
              <span class="info-value">${count}</span>
            </div>
          `
          )
          .join('')}
      </div>

      ${
        this.sampleData.fusions.length > 0
          ? `
      <div class="info-section">
        <div class="info-section-title">Fusions (${this.sampleData.fusions.length})</div>
        ${this.sampleData.fusions
          .map(
            (f) => `
          <div class="info-row" style="flex-direction: column; align-items: flex-start; margin-bottom: 8px;">
            <span class="info-value" style="font-weight: 600;">${f.geneA}-${f.geneB}</span>
            <span class="info-label" style="font-size: 0.75rem;">${f.chrA} ↔ ${f.chrB}</span>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }
    `;
  }

  private groupMutationsByClass(): Map<string, number> {
    const counts = new Map<string, number>();
    if (!this.sampleData) return counts;

    for (const mut of this.sampleData.mutations) {
      counts.set(mut.class, (counts.get(mut.class) || 0) + 1);
    }
    return counts;
  }

  private countAffectedChromosomes(): number {
    if (!this.sampleData) return 0;

    const chromosomes = new Set<string>();
    for (const mut of this.sampleData.mutations) chromosomes.add(mut.chr);
    for (const cnv of this.sampleData.cnv) chromosomes.add(cnv.chr);
    for (const fusion of this.sampleData.fusions) {
      chromosomes.add(fusion.chrA);
      chromosomes.add(fusion.chrB);
    }
    return chromosomes.size;
  }

  // Tooltip methods
  private showTooltip(event: MouseEvent, html: string): void {
    this.tooltip.innerHTML = html;
    this.tooltip.classList.add('visible');
    this.moveTooltip(event);
  }

  private moveTooltip(event: MouseEvent): void {
    const x = event.clientX + 15;
    const y = event.clientY + 15;
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  private hideTooltip(): void {
    this.tooltip.classList.remove('visible');
  }

  /**
   * Update settings and re-render
   */
  public updateSettings(newSettings: Partial<DiscoSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // Rebuild reference if radius changed
    if (newSettings.radius) {
      this.reference = new Reference(this.genome, this.settings);

      // Update SVG size
      this.svg
        .attr('width', this.settings.radius * 2 + 100)
        .attr('height', this.settings.radius * 2 + 100);

      this.mainGroup.attr(
        'transform',
        `translate(${this.settings.radius + 50}, ${this.settings.radius + 50})`
      );
    }

    // Reprocess data with new settings
    if (this.sampleData) {
      this.processData();
    }

    this.render();
  }

  /**
   * Render legend
   */
  public renderLegend(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="legend-title">Mutation Types</div>
      ${Object.entries(MUTATION_COLORS)
        .filter(([cls]) => this.hasMutationType(cls as MutationClass))
        .map(
          ([cls, color]) => `
          <div class="legend-item">
            <span class="legend-color" style="background: ${color}"></span>
            <span>${getMutationLabel(cls as MutationClass)}</span>
          </div>
        `
        )
        .join('')}
      
      <div class="legend-title" style="margin-top: 1rem;">Copy Number</div>
      <div class="legend-item">
        <span class="legend-color" style="background: #e74c3c"></span>
        <span>Gain</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #3498db"></span>
        <span>Loss</span>
      </div>
    `;
  }

  private hasMutationType(mutClass: MutationClass): boolean {
    return this.sampleData?.mutations.some((m) => m.class === mutClass) || false;
  }
}
