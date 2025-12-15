/**
 * Fusion Detail Component
 *
 * Information panel showing fusion details,
 * evidence, and clinical annotations.
 */

import * as d3 from 'd3';

/**
 * Fusion Detail panel component
 *
 * @class FusionDetail
 */
export class FusionDetail {
  /**
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.options = {
      width: options.width || 350,
      showClinical: options.showClinical !== false,
      showEvidence: options.showEvidence !== false,
      ...options,
    };

    this.fusion = null;
    this._initPanel();
  }

  /**
   * Initialize panel structure
   * @private
   */
  _initPanel() {
    d3.select(this.container).selectAll('.fusion-detail-panel').remove();

    this.panel = d3
      .select(this.container)
      .append('div')
      .attr('class', 'fusion-detail-panel')
      .style('width', `${this.options.width}px`)
      .style('font-family', "'Segoe UI', sans-serif");

    // Header
    this.header = this.panel
      .append('div')
      .attr('class', 'fusion-header')
      .style('background', 'linear-gradient(135deg, #3498db, #9b59b6)')
      .style('color', 'white')
      .style('padding', '16px')
      .style('border-radius', '8px 8px 0 0');

    // Content sections
    this.content = this.panel
      .append('div')
      .attr('class', 'fusion-content')
      .style('padding', '16px')
      .style('background', '#fff')
      .style('border', '1px solid #e0e0e0')
      .style('border-top', 'none')
      .style('border-radius', '0 0 8px 8px');

    // Section containers
    this.geneSection = this.content.append('div').attr('class', 'gene-section');
    this.breakpointSection = this.content.append('div').attr('class', 'breakpoint-section');
    this.evidenceSection = this.content.append('div').attr('class', 'evidence-section');
    this.clinicalSection = this.content.append('div').attr('class', 'clinical-section');
    this.actionsSection = this.content.append('div').attr('class', 'actions-section');
  }

  /**
   * Set fusion to display
   * @param {Object} fusion - Fusion data object
   */
  setFusion(fusion) {
    this.fusion = fusion;
    this.render();
  }

  /**
   * Render the detail panel
   */
  render() {
    if (!this.fusion) {
      this._renderEmpty();
      return;
    }

    this._renderHeader();
    this._renderGenes();
    this._renderBreakpoints();

    if (this.options.showEvidence) {
      this._renderEvidence();
    }

    if (this.options.showClinical) {
      this._renderClinical();
    }

    this._renderActions();
  }

  /**
   * Render empty state
   * @private
   */
  _renderEmpty() {
    this.header.html(`
      <h3 style="margin: 0; font-size: 16px;">No Fusion Selected</h3>
    `);

    this.content.html(`
      <p style="color: #666; text-align: center; padding: 20px;">
        Click on a fusion in the visualization to see details
      </p>
    `);
  }

  /**
   * Render header
   * @private
   */
  _renderHeader() {
    const f = this.fusion;
    const fusionName = `${f.gene5?.name || f.gene5}-${f.gene3?.name || f.gene3}`;

    this.header.html(`
      <h3 style="margin: 0 0 4px 0; font-size: 18px;">${fusionName}</h3>
      <div style="font-size: 13px; opacity: 0.9;">
        ${f.type || 'Gene Fusion'} • ${f.reads || 0} supporting reads
      </div>
    `);
  }

  /**
   * Render gene information
   * @private
   */
  _renderGenes() {
    const f = this.fusion;

    this.geneSection.html(`
      <h4 style="margin: 0 0 12px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
        Partner Genes
      </h4>
      
      <div style="display: flex; gap: 20px; margin-bottom: 16px;">
        <!-- 5' Partner -->
        <div style="flex: 1; padding: 12px; background: rgba(52, 152, 219, 0.1); border-radius: 6px; border-left: 4px solid #3498db;">
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">5' Partner</div>
          <div style="font-size: 16px; font-weight: bold; color: #3498db;">
            ${f.gene5?.name || f.gene5}
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            ${f.gene5?.chromosome || f.chr5 || 'Unknown'} ${f.gene5?.strand === '-' ? '(-)' : '(+)'}
          </div>
          <div style="font-size: 11px; color: #888; margin-top: 2px;">
            Exon ${f.gene5?.exon || 'N/A'}
          </div>
        </div>
        
        <!-- 3' Partner -->
        <div style="flex: 1; padding: 12px; background: rgba(155, 89, 182, 0.1); border-radius: 6px; border-left: 4px solid #9b59b6;">
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">3' Partner</div>
          <div style="font-size: 16px; font-weight: bold; color: #9b59b6;">
            ${f.gene3?.name || f.gene3}
          </div>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            ${f.gene3?.chromosome || f.chr3 || 'Unknown'} ${f.gene3?.strand === '-' ? '(-)' : '(+)'}
          </div>
          <div style="font-size: 11px; color: #888; margin-top: 2px;">
            Exon ${f.gene3?.exon || 'N/A'}
          </div>
        </div>
      </div>
    `);
  }

  /**
   * Render breakpoint information
   * @private
   */
  _renderBreakpoints() {
    const f = this.fusion;

    this.breakpointSection.html(`
      <h4 style="margin: 0 0 12px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
        Breakpoint Coordinates
      </h4>
      
      <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px;">
        <div style="margin-bottom: 8px;">
          <span style="color: #3498db;">5' Break:</span>
          <span style="color: #333;">${f.breakpoint5?.toLocaleString() || 'N/A'}</span>
        </div>
        <div>
          <span style="color: #9b59b6;">3' Break:</span>
          <span style="color: #333;">${f.breakpoint3?.toLocaleString() || 'N/A'}</span>
        </div>
      </div>
      
      ${
        f.frame
          ? `
        <div style="margin-top: 12px; padding: 8px 12px; background: ${f.frame === 'in-frame' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)'}; border-radius: 4px;">
          <span style="font-size: 12px; color: ${f.frame === 'in-frame' ? '#27ae60' : '#e74c3c'};">
            ${f.frame === 'in-frame' ? '✓ In-frame fusion' : '✗ Out-of-frame fusion'}
          </span>
        </div>
      `
          : ''
      }
    `);
  }

  /**
   * Render evidence section
   * @private
   */
  _renderEvidence() {
    const f = this.fusion;
    const evidence = f.evidence || {};

    this.evidenceSection.html(`
      <h4 style="margin: 16px 0 12px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
        Supporting Evidence
      </h4>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="padding: 8px; background: #f0f0f0; border-radius: 4px; text-align: center;">
          <div style="font-size: 20px; font-weight: bold; color: #333;">
            ${f.reads || evidence.splitReads || 0}
          </div>
          <div style="font-size: 11px; color: #666;">Split Reads</div>
        </div>
        
        <div style="padding: 8px; background: #f0f0f0; border-radius: 4px; text-align: center;">
          <div style="font-size: 20px; font-weight: bold; color: #333;">
            ${evidence.spanningPairs || 0}
          </div>
          <div style="font-size: 11px; color: #666;">Spanning Pairs</div>
        </div>
        
        <div style="padding: 8px; background: #f0f0f0; border-radius: 4px; text-align: center;">
          <div style="font-size: 20px; font-weight: bold; color: #333;">
            ${evidence.junctionReads || f.reads || 0}
          </div>
          <div style="font-size: 11px; color: #666;">Junction Reads</div>
        </div>
        
        <div style="padding: 8px; background: #f0f0f0; border-radius: 4px; text-align: center;">
          <div style="font-size: 20px; font-weight: bold; color: #333;">
            ${f.confidence || evidence.confidence || 'N/A'}
          </div>
          <div style="font-size: 11px; color: #666;">Confidence</div>
        </div>
      </div>
      
      ${
        f.callers
          ? `
        <div style="margin-top: 12px; font-size: 12px; color: #666;">
          <strong>Called by:</strong> ${f.callers.join(', ')}
        </div>
      `
          : ''
      }
    `);
  }

  /**
   * Render clinical annotations
   * @private
   */
  _renderClinical() {
    const f = this.fusion;
    const clinical = f.clinical || {};

    // Check if there's any clinical data
    const hasClinical =
      clinical.oncogenic ||
      clinical.drugs?.length > 0 ||
      clinical.trials?.length > 0 ||
      f.diseaseType;

    if (!hasClinical) {
      this.clinicalSection.html('');
      return;
    }

    this.clinicalSection.html(`
      <h4 style="margin: 16px 0 12px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
        Clinical Significance
      </h4>
      
      ${
        clinical.oncogenic
          ? `
        <div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(231, 76, 60, 0.1); border-radius: 4px; border-left: 4px solid #e74c3c;">
          <div style="font-size: 12px; font-weight: bold; color: #e74c3c;">
            ${clinical.oncogenic}
          </div>
          ${
            clinical.level
              ? `
            <div style="font-size: 11px; color: #666; margin-top: 4px;">
              Evidence Level: ${clinical.level}
            </div>
          `
              : ''
          }
        </div>
      `
          : ''
      }
      
      ${
        f.diseaseType
          ? `
        <div style="font-size: 12px; margin-bottom: 8px;">
          <strong>Associated Disease:</strong> ${f.diseaseType}
        </div>
      `
          : ''
      }
      
      ${
        clinical.drugs?.length > 0
          ? `
        <div style="margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: bold; color: #333; margin-bottom: 4px;">
            Targetable Therapies:
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${clinical.drugs
              .map(
                (drug) => `
              <span style="padding: 2px 8px; background: #e8f5e9; color: #2e7d32; border-radius: 12px; font-size: 11px;">
                ${drug}
              </span>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }
      
      ${
        clinical.trials?.length > 0
          ? `
        <div style="font-size: 12px; color: #666;">
          <strong>Clinical Trials:</strong> ${clinical.trials.length} active
        </div>
      `
          : ''
      }
    `);
  }

  /**
   * Render action buttons
   * @private
   */
  _renderActions() {
    const f = this.fusion;
    const fusionName = `${f.gene5?.name || f.gene5}-${f.gene3?.name || f.gene3}`;

    this.actionsSection.html(`
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; display: flex; gap: 8px;">
        <button class="action-btn" data-action="cosmic" style="
          flex: 1;
          padding: 8px 12px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        ">COSMIC</button>
        
        <button class="action-btn" data-action="civic" style="
          flex: 1;
          padding: 8px 12px;
          background: #27ae60;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        ">CIViC</button>
        
        <button class="action-btn" data-action="oncokb" style="
          flex: 1;
          padding: 8px 12px;
          background: #9b59b6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        ">OncoKB</button>
      </div>
    `);

    // Add click handlers
    this.actionsSection.selectAll('.action-btn').on('click', (event) => {
      const action = event.target.dataset.action;
      this._handleAction(action, fusionName);
    });
  }

  /**
   * Handle action button clicks
   * @private
   */
  _handleAction(action, fusionName) {
    const urls = {
      cosmic: `https://cancer.sanger.ac.uk/cosmic/fusion/summary?fid=${encodeURIComponent(fusionName)}`,
      civic: `https://civicdb.org/search?query=${encodeURIComponent(fusionName)}`,
      oncokb: `https://www.oncokb.org/gene/${encodeURIComponent(fusionName)}`,
    };

    if (urls[action]) {
      window.open(urls[action], '_blank');
    }
  }

  /**
   * Update a specific section
   * @param {string} section - Section name
   * @param {Object} data - Data to update
   */
  updateSection(section, data) {
    if (!this.fusion) return;

    Object.assign(this.fusion, data);

    switch (section) {
      case 'evidence':
        this._renderEvidence();
        break;
      case 'clinical':
        this._renderClinical();
        break;
      default:
        this.render();
    }
  }

  /**
   * Destroy the component
   */
  destroy() {
    this.panel.remove();
  }
}

export default FusionDetail;
