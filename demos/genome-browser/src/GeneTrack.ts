/**
 * GeneTrack - Renders gene structures with exons, introns, and strand direction
 */

import * as d3 from 'd3';
import { Track, TrackRenderContext } from './Track';
import type { TrackConfig, GeneFeature, GeneTrackData } from './types';

export interface GeneTrackConfig extends TrackConfig {
  type: 'gene';
  exonHeight: number;
  intronHeight: number;
  showLabels: boolean;
}

const EXON_COLORS = {
  cds: '#1976D2',
  utr5: '#64B5F6',
  utr3: '#64B5F6',
  exon: '#42A5F5',
};

export class GeneTrack extends Track<GeneTrackData, GeneTrackConfig> {
  constructor(config: Partial<GeneTrackConfig> & { id: string; name: string }) {
    super({
      type: 'gene',
      height: 80,
      visible: true,
      collapsed: false,
      exonHeight: 20,
      intronHeight: 2,
      showLabels: true,
      ...config,
    });
  }

  protected renderContent(context: TrackRenderContext): void {
    if (!this.data?.genes.length) {
      this.renderEmpty(context);
      return;
    }

    const { svg, xScale } = context;
    const { exonHeight, intronHeight } = this.config;

    // Layout genes in rows to avoid overlap
    const geneRows = this.layoutGenes(this.data.genes, xScale);

    const rowHeight = exonHeight + 15; // Height per row including spacing
    const startY = 10;

    geneRows.forEach((genes, rowIndex) => {
      const rowY = startY + rowIndex * rowHeight;

      genes.forEach((gene) => {
        this.renderGene(svg, gene, xScale, rowY, exonHeight, intronHeight);
      });
    });
  }

  private layoutGenes(
    genes: GeneFeature[],
    xScale: d3.ScaleLinear<number, number>
  ): GeneFeature[][] {
    const rows: GeneFeature[][] = [];
    const padding = 50; // Minimum pixels between genes

    for (const gene of genes) {
      const geneStart = xScale(gene.start);

      // Find a row where this gene fits
      let placed = false;
      for (const row of rows) {
        const lastGene = row[row.length - 1];
        const lastEnd = xScale(lastGene.end);

        if (geneStart > lastEnd + padding) {
          row.push(gene);
          placed = true;
          break;
        }
      }

      if (!placed) {
        rows.push([gene]);
      }
    }

    return rows;
  }

  private renderGene(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    gene: GeneFeature,
    xScale: d3.ScaleLinear<number, number>,
    y: number,
    exonHeight: number,
    intronHeight: number
  ): void {
    const geneGroup = svg.append('g').attr('class', 'gene').attr('data-gene-id', gene.id);

    const startX = xScale(gene.start);
    const endX = xScale(gene.end);
    const centerY = y + exonHeight / 2;

    // Render intron line
    geneGroup
      .append('line')
      .attr('class', 'intron-line')
      .attr('x1', Math.max(0, startX))
      .attr('x2', endX)
      .attr('y1', centerY)
      .attr('y2', centerY)
      .attr('stroke', '#666')
      .attr('stroke-width', intronHeight);

    // Render strand direction arrows
    this.renderStrandArrows(geneGroup, gene, xScale, centerY);

    // Render exons
    for (const exon of gene.exons) {
      const exonStart = xScale(exon.start);
      const exonEnd = xScale(exon.end);
      const exonWidth = Math.max(2, exonEnd - exonStart);

      // Skip exons outside visible range
      if (exonEnd < 0 || exonStart > xScale.range()[1]) continue;

      const rect = geneGroup
        .append('rect')
        .attr('class', `exon exon-${exon.type}`)
        .attr('x', Math.max(0, exonStart))
        .attr('y', y)
        .attr('width', exonWidth)
        .attr('height', exonHeight)
        .attr('fill', EXON_COLORS[exon.type] || EXON_COLORS.exon)
        .attr('rx', 2)
        .style('cursor', 'pointer');

      // Add hover handlers
      rect.on('mouseover', (event) => {
        rect.attr('stroke', '#333').attr('stroke-width', 2);
        this.onFeatureHover?.({ gene, exon, type: 'exon' }, event as unknown as MouseEvent);
      });

      rect.on('mouseout', () => {
        rect.attr('stroke', 'none');
      });

      rect.on('click', (event) => {
        this.onFeatureClick?.({ gene, exon, type: 'exon' }, event as unknown as MouseEvent);
      });
    }

    // Render gene label
    if (this.config.showLabels) {
      const labelX = Math.max(5, startX);
      geneGroup
        .append('text')
        .attr('class', 'gene-label')
        .attr('x', labelX)
        .attr('y', y - 4)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text(gene.symbol);

      // Strand indicator
      geneGroup
        .append('text')
        .attr('class', 'strand-indicator')
        .attr('x', labelX + gene.symbol.length * 8 + 5)
        .attr('y', y - 4)
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .text(gene.strand === '+' ? '→' : '←');
    }
  }

  private renderStrandArrows(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    gene: GeneFeature,
    xScale: d3.ScaleLinear<number, number>,
    centerY: number
  ): void {
    const startX = Math.max(0, xScale(gene.start));
    const endX = xScale(gene.end);
    const arrowSpacing = 100;
    const arrowSize = 4;

    for (let x = startX + arrowSpacing; x < endX - 10; x += arrowSpacing) {
      const direction = gene.strand === '+' ? 1 : -1;
      const points = [
        [x - arrowSize * direction, centerY - arrowSize],
        [x, centerY],
        [x - arrowSize * direction, centerY + arrowSize],
      ];

      group
        .append('polyline')
        .attr('class', 'strand-arrow')
        .attr('points', points.map((p) => p.join(',')).join(' '))
        .attr('fill', 'none')
        .attr('stroke', '#999')
        .attr('stroke-width', 1.5);
    }
  }

  private renderEmpty(context: TrackRenderContext): void {
    const { svg, width, height } = context;

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#999')
      .attr('font-size', '12px')
      .text('No genes in this region');
  }

  getTooltipContent(feature: unknown): string {
    const { gene, exon } = feature as { gene: GeneFeature; exon?: { type: string } };

    let html = `
      <strong>${gene.symbol}</strong><br>
      ${gene.id}<br>
      <br>
      <strong>Location:</strong> ${gene.chromosome}:${gene.start.toLocaleString()}-${gene.end.toLocaleString()}<br>
      <strong>Strand:</strong> ${gene.strand === '+' ? 'Forward (+)' : 'Reverse (-)'}<br>
      <strong>Exons:</strong> ${gene.exons.length}
    `;

    if (exon) {
      html += `<br><br><strong>Exon Type:</strong> ${exon.type.toUpperCase()}`;
    }

    return html;
  }
}
