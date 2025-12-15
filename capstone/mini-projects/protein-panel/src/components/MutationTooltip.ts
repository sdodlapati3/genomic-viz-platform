/**
 * Mutation Tooltip Component
 *
 * Rich tooltip showing detailed mutation information
 */

import * as d3 from 'd3';
import type { Mutation, MutationStack } from '../types';
import {
  CONSEQUENCE_COLORS,
  CONSEQUENCE_LABELS,
  formatMutation,
  getMutationColor,
} from '../types/mutation';

export interface MutationTooltipConfig {
  /** Custom styles */
  styles?: Partial<CSSStyleDeclaration>;
  /** Max width */
  maxWidth?: number;
  /** Show extended info (ClinVar, COSMIC, etc.) */
  showExtendedInfo?: boolean;
}

export class MutationTooltip {
  private tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private config: MutationTooltipConfig;

  constructor(config: MutationTooltipConfig = {}) {
    this.config = {
      maxWidth: 320,
      showExtendedInfo: true,
      ...config,
    };

    this.tooltip = this.createTooltip();
  }

  private createTooltip(): d3.Selection<HTMLDivElement, unknown, null, undefined> {
    // Remove any existing tooltip
    d3.select('body').selectAll('.mutation-tooltip-container').remove();

    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'mutation-tooltip-container')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '6px')
      .style('padding', '0')
      .style('font-size', '12px')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
      .style('pointer-events', 'none')
      .style('z-index', '10000')
      .style('max-width', `${this.config.maxWidth}px`)
      .style('overflow', 'hidden');

    return tooltip;
  }

  /**
   * Show tooltip for a mutation
   */
  show(mutation: Mutation, event: MouseEvent): void {
    this.tooltip.html(this.renderContent(mutation));
    this.position(event);
    this.tooltip.style('visibility', 'visible');
  }

  /**
   * Show tooltip for a mutation stack
   */
  showStack(stack: MutationStack, event: MouseEvent): void {
    this.tooltip.html(this.renderStackContent(stack));
    this.position(event);
    this.tooltip.style('visibility', 'visible');
  }

  /**
   * Hide tooltip
   */
  hide(): void {
    this.tooltip.style('visibility', 'hidden');
  }

  /**
   * Update position
   */
  position(event: MouseEvent): void {
    const tooltipNode = this.tooltip.node();
    if (!tooltipNode) return;

    const rect = tooltipNode.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = event.pageX + 15;
    let top = event.pageY - 10;

    // Prevent overflow right
    if (left + rect.width > viewportWidth - 10) {
      left = event.pageX - rect.width - 15;
    }

    // Prevent overflow bottom
    if (top + rect.height > viewportHeight - 10) {
      top = event.pageY - rect.height - 10;
    }

    this.tooltip.style('left', `${Math.max(10, left)}px`).style('top', `${Math.max(10, top)}px`);
  }

  private renderContent(mutation: Mutation): string {
    const color = getMutationColor(mutation.consequence);

    return `
      <div style="border-left: 4px solid ${color}; padding: 12px;">
        <!-- Header -->
        <div style="margin-bottom: 10px;">
          <div style="font-size: 15px; font-weight: 600; color: #333;">
            ${formatMutation(mutation)}
          </div>
          <div style="font-size: 11px; color: #888; margin-top: 2px;">
            Position ${mutation.position}
          </div>
        </div>
        
        <!-- Type badge -->
        <div style="margin-bottom: 10px;">
          <span style="
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            background: ${color}22;
            color: ${color};
          ">
            ${CONSEQUENCE_LABELS[mutation.consequence]}
          </span>
          
          <span style="
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            margin-left: 4px;
            background: ${mutation.origin === 'germline' ? '#27AE6022' : '#E74C3C22'};
            color: ${mutation.origin === 'germline' ? '#27AE60' : '#E74C3C'};
          ">
            ${mutation.origin === 'germline' ? 'Germline' : 'Somatic'}
          </span>
        </div>
        
        <!-- Stats -->
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 4px;
          margin-bottom: 10px;
        ">
          <div>
            <div style="font-size: 10px; color: #888; text-transform: uppercase;">Samples</div>
            <div style="font-size: 16px; font-weight: 600; color: #333;">${mutation.sampleCount}</div>
          </div>
          ${
            mutation.gnomadAF !== undefined
              ? `
            <div>
              <div style="font-size: 10px; color: #888; text-transform: uppercase;">gnomAD AF</div>
              <div style="font-size: 14px; font-weight: 500; color: #333;">${(mutation.gnomadAF * 100).toFixed(4)}%</div>
            </div>
          `
              : ''
          }
        </div>
        
        ${this.config.showExtendedInfo ? this.renderExtendedInfo(mutation) : ''}
      </div>
    `;
  }

  private renderExtendedInfo(mutation: Mutation): string {
    const items: string[] = [];

    if (mutation.clinicalSignificance) {
      const sigColors: Record<string, string> = {
        pathogenic: '#E74C3C',
        likely_pathogenic: '#E67E22',
        uncertain: '#F39C12',
        likely_benign: '#3498DB',
        benign: '#27AE60',
        conflicting: '#9B59B6',
      };
      const color = sigColors[mutation.clinicalSignificance] || '#666';
      items.push(`
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span style="color: #666;">ClinVar</span>
          <span style="color: ${color}; font-weight: 500;">${mutation.clinicalSignificance.replace('_', ' ')}</span>
        </div>
      `);
    }

    if (mutation.cosmicId) {
      items.push(`
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span style="color: #666;">COSMIC</span>
          <span style="color: #333; font-family: monospace;">${mutation.cosmicId}</span>
        </div>
      `);
    }

    if (mutation.rsId) {
      items.push(`
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span style="color: #666;">dbSNP</span>
          <span style="color: #333; font-family: monospace;">${mutation.rsId}</span>
        </div>
      `);
    }

    if (mutation.functionalImpact) {
      const impactColors: Record<string, string> = {
        high: '#E74C3C',
        moderate: '#F39C12',
        low: '#3498DB',
        modifier: '#95A5A6',
      };
      items.push(`
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span style="color: #666;">Impact</span>
          <span style="color: ${impactColors[mutation.functionalImpact]}; font-weight: 500;">
            ${mutation.functionalImpact.toUpperCase()}
          </span>
        </div>
      `);
    }

    if (mutation.isHotspot) {
      items.push(`
        <div style="
          margin-top: 8px;
          padding: 6px 8px;
          background: #FFF3E0;
          border-radius: 3px;
          font-size: 11px;
          color: #E65100;
        ">
          🔥 Mutation Hotspot
        </div>
      `);
    }

    if (items.length === 0) return '';

    return `
      <div style="border-top: 1px solid #eee; padding-top: 10px; font-size: 11px;">
        ${items.join('')}
      </div>
    `;
  }

  private renderStackContent(stack: MutationStack): string {
    if (stack.mutations.length === 1) {
      return this.renderContent(stack.mutations[0]);
    }

    const primaryMutation = stack.mutations[0];
    const color = getMutationColor(primaryMutation.consequence);

    return `
      <div style="border-left: 4px solid ${color}; padding: 12px;">
        <!-- Header -->
        <div style="margin-bottom: 10px;">
          <div style="font-size: 15px; font-weight: 600; color: #333;">
            Position ${stack.position}
          </div>
          <div style="font-size: 11px; color: #888; margin-top: 2px;">
            ${stack.mutations.length} distinct mutations
          </div>
        </div>
        
        <!-- Total samples -->
        <div style="
          padding: 10px;
          background: #f8f9fa;
          border-radius: 4px;
          margin-bottom: 10px;
          text-align: center;
        ">
          <div style="font-size: 10px; color: #888; text-transform: uppercase;">Total Samples</div>
          <div style="font-size: 20px; font-weight: 600; color: #333;">${stack.totalCount}</div>
        </div>
        
        <!-- Mutation list -->
        <div style="font-size: 11px;">
          ${stack.mutations
            .slice(0, 5)
            .map(
              (m) => `
            <div style="
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              border-bottom: 1px solid #f0f0f0;
            ">
              <span style="font-family: monospace;">${formatMutation(m)}</span>
              <span style="color: #666;">${m.sampleCount} samples</span>
            </div>
          `
            )
            .join('')}
          ${
            stack.mutations.length > 5
              ? `
            <div style="color: #888; font-style: italic; padding-top: 6px;">
              +${stack.mutations.length - 5} more mutations
            </div>
          `
              : ''
          }
        </div>
        
        <!-- Origin indicators -->
        <div style="margin-top: 10px; display: flex; gap: 8px;">
          ${
            stack.hasGermline
              ? `
            <span style="
              padding: 3px 8px;
              border-radius: 3px;
              font-size: 10px;
              background: #27AE6022;
              color: #27AE60;
            ">Germline</span>
          `
              : ''
          }
          ${
            stack.hasSomatic
              ? `
            <span style="
              padding: 3px 8px;
              border-radius: 3px;
              font-size: 10px;
              background: #E74C3C22;
              color: #E74C3C;
            ">Somatic</span>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  /**
   * Destroy tooltip
   */
  destroy(): void {
    this.tooltip.remove();
  }
}
