/**
 * Advanced Tracks Demo
 *
 * Demonstrates the professional genomic visualization tracks:
 * - BAM Track: Read alignment visualization
 * - BigWig Track: Signal/coverage visualization
 * - Junction Track: Splice junction arcs
 * - Numeric Mode: Flexible numeric display
 *
 * These components represent professional-grade implementations
 * suitable for production genomic analysis platforms.
 */

import * as d3 from 'd3';
import { BamTrack, generateSampleBamData, bamTrackStyles } from './tracks/BamTrack';
import {
  BigWigTrack,
  generateSampleBigWigData,
  BIGWIG_COLOR_PRESETS,
  bigWigTrackStyles,
} from './tracks/BigWigTrack';
import {
  JunctionTrack,
  generateSampleJunctionData,
  junctionTrackStyles,
} from './tracks/JunctionTrack';
import {
  NumericMode,
  generateSampleNumericData,
  numericModeStyles,
} from '../../../shared/components/NumericMode';

// Inject CSS styles
const styleElement = document.createElement('style');
styleElement.textContent = `
  ${bamTrackStyles}
  ${bigWigTrackStyles}
  ${junctionTrackStyles}
  ${numericModeStyles}
  
  body {
    background: #0d1117;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 20px;
  }
  
  .demo-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    color: #58a6ff;
    border-bottom: 1px solid #30363d;
    padding-bottom: 10px;
  }
  
  h2 {
    color: #8b949e;
    margin-top: 40px;
  }
  
  .track-section {
    background: #161b22;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
    border: 1px solid #30363d;
  }
  
  .track-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .track-title h3 {
    margin: 0;
    color: #c9d1d9;
  }
  
  .controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-bottom: 15px;
  }
  
  .control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .control-group label {
    font-size: 11px;
    color: #8b949e;
  }
  
  select, input[type="range"], button {
    background: #21262d;
    border: 1px solid #30363d;
    color: #c9d1d9;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
  }
  
  button {
    cursor: pointer;
    transition: background 0.2s;
  }
  
  button:hover {
    background: #30363d;
  }
  
  button.primary {
    background: #238636;
    border-color: #238636;
  }
  
  button.primary:hover {
    background: #2ea043;
  }
  
  .region-display {
    font-family: monospace;
    background: #21262d;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
    color: #58a6ff;
  }
  
  .stats-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #30363d;
  }
  
  .stat-item {
    background: #21262d;
    padding: 10px;
    border-radius: 4px;
  }
  
  .stat-label {
    font-size: 11px;
    color: #8b949e;
  }
  
  .stat-value {
    font-size: 18px;
    font-weight: bold;
    color: #58a6ff;
  }
  
  .feature-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin: 20px 0;
  }
  
  .feature-card {
    background: #21262d;
    padding: 15px;
    border-radius: 8px;
    border-left: 3px solid #238636;
  }
  
  .feature-card h4 {
    margin: 0 0 10px 0;
    color: #c9d1d9;
  }
  
  .feature-card p {
    margin: 0;
    font-size: 13px;
    color: #8b949e;
    line-height: 1.5;
  }
`;
document.head.appendChild(styleElement);

// Demo configuration
const config = {
  chr: 'chr17',
  start: 7570000,
  end: 7590000,
  width: 1000,
};

/**
 * Initialize and render all demos
 */
function initDemo(): void {
  const container = document.getElementById('app');
  if (!container) return;

  container.innerHTML = `
    <div class="demo-container">
      <h1>🧬 Professional Genomic Tracks</h1>
      
      <p style="color: #8b949e; margin-bottom: 30px;">
        Production-grade visualization components for BAM alignments, 
        BigWig signals, splice junctions, and numeric data display.
      </p>
      
      <div class="feature-list">
        <div class="feature-card">
          <h4>📊 BAM Track</h4>
          <p>Read alignment visualization with coverage histograms, 
             CIGAR parsing, strand coloring, and mapping quality display.</p>
        </div>
        <div class="feature-card">
          <h4>📈 BigWig Track</h4>
          <p>Signal/coverage visualization for ChIP-seq, ATAC-seq, and RNA-seq 
             with multiple display modes and auto-scaling.</p>
        </div>
        <div class="feature-card">
          <h4>🔗 Junction Track</h4>
          <p>Splice junction arcs with read count annotations, 
             novel vs known distinction, and motif classification.</p>
        </div>
        <div class="feature-card">
          <h4>🔢 Numeric Mode</h4>
          <p>Flexible numeric data display with multiple scales, 
             color palettes, and chart types.</p>
        </div>
      </div>
      
      <!-- Navigation -->
      <div class="track-section">
        <div class="track-title">
          <h3>🗺️ Region Navigation</h3>
          <span class="region-display" id="region-display">${config.chr}:${config.start.toLocaleString()}-${config.end.toLocaleString()}</span>
        </div>
        <div class="controls">
          <button onclick="zoomIn()">🔍 Zoom In</button>
          <button onclick="zoomOut()">🔍 Zoom Out</button>
          <button onclick="panLeft()">⬅️ Pan Left</button>
          <button onclick="panRight()">➡️ Pan Right</button>
          <button onclick="resetView()">🔄 Reset</button>
        </div>
      </div>
      
      <!-- BAM Track -->
      <div class="track-section">
        <div class="track-title">
          <h3>📊 BAM Track - Read Alignments</h3>
        </div>
        <div class="controls">
          <div class="control-group">
            <label>Color By</label>
            <select id="bam-color-by" onchange="updateBamTrack()">
              <option value="strand">Strand</option>
              <option value="mapq">Mapping Quality</option>
              <option value="insertSize">Insert Size</option>
              <option value="pairOrientation">Pair Orientation</option>
            </select>
          </div>
          <div class="control-group">
            <label>Min MAPQ</label>
            <input type="range" id="bam-min-mapq" min="0" max="60" value="0" onchange="updateBamTrack()">
          </div>
          <div class="control-group">
            <label>Show Coverage</label>
            <select id="bam-show-coverage" onchange="updateBamTrack()">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
        <div id="bam-track-container"></div>
        <div class="stats-panel" id="bam-stats"></div>
      </div>
      
      <!-- BigWig Track -->
      <div class="track-section">
        <div class="track-title">
          <h3>📈 BigWig Track - Signal/Coverage</h3>
        </div>
        <div class="controls">
          <div class="control-group">
            <label>Display Mode</label>
            <select id="bigwig-display" onchange="updateBigWigTrack()">
              <option value="area">Area</option>
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="heatmap">Heatmap</option>
            </select>
          </div>
          <div class="control-group">
            <label>Signal Type</label>
            <select id="bigwig-signal" onchange="regenerateBigWigData()">
              <option value="chipseq">ChIP-seq</option>
              <option value="rnaseq">RNA-seq</option>
              <option value="atacseq">ATAC-seq</option>
            </select>
          </div>
          <div class="control-group">
            <label>Scale</label>
            <select id="bigwig-scale" onchange="updateBigWigTrack()">
              <option value="auto">Auto</option>
              <option value="log">Log</option>
              <option value="fixed">Fixed (0-100)</option>
            </select>
          </div>
          <div class="control-group">
            <label>Smoothing</label>
            <input type="range" id="bigwig-smooth" min="0" max="20" value="3" onchange="updateBigWigTrack()">
          </div>
        </div>
        <div id="bigwig-track-container"></div>
      </div>
      
      <!-- Junction Track -->
      <div class="track-section">
        <div class="track-title">
          <h3>🔗 Junction Track - Splice Junctions</h3>
        </div>
        <div class="controls">
          <div class="control-group">
            <label>Color By</label>
            <select id="junction-color-by" onchange="updateJunctionTrack()">
              <option value="annotated">Known/Novel</option>
              <option value="strand">Strand</option>
              <option value="motif">Splice Motif</option>
              <option value="readCount">Read Count</option>
            </select>
          </div>
          <div class="control-group">
            <label>Min Reads</label>
            <input type="range" id="junction-min-reads" min="1" max="50" value="5" onchange="updateJunctionTrack()">
          </div>
          <div class="control-group">
            <label>Show Labels</label>
            <select id="junction-labels" onchange="updateJunctionTrack()">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
        <div id="junction-track-container"></div>
        <div class="stats-panel" id="junction-stats"></div>
      </div>
      
      <!-- Numeric Mode -->
      <div class="track-section">
        <div class="track-title">
          <h3>🔢 Numeric Mode - Data Display</h3>
        </div>
        <div class="controls">
          <div class="control-group">
            <label>Display Mode</label>
            <select id="numeric-display" onchange="updateNumericMode()">
              <option value="bar">Bar Chart</option>
              <option value="dot">Dot Plot</option>
              <option value="heatcell">Heatmap Cells</option>
              <option value="area">Area Chart</option>
              <option value="text">Text Display</option>
            </select>
          </div>
          <div class="control-group">
            <label>Scale</label>
            <select id="numeric-scale" onchange="updateNumericMode()">
              <option value="linear">Linear</option>
              <option value="log">Logarithmic</option>
              <option value="sqrt">Square Root</option>
            </select>
          </div>
          <div class="control-group">
            <label>Color Palette</label>
            <select id="numeric-palette" onchange="updateNumericMode()">
              <option value="viridis">Viridis</option>
              <option value="plasma">Plasma</option>
              <option value="blues">Blues</option>
              <option value="reds">Reds</option>
              <option value="diverging">Diverging</option>
            </select>
          </div>
          <div class="control-group">
            <label>Sort By</label>
            <select id="numeric-sort" onchange="updateNumericMode()">
              <option value="none">None</option>
              <option value="value">Value</option>
              <option value="label">Label</option>
            </select>
          </div>
        </div>
        <div id="numeric-mode-container"></div>
      </div>
    </div>
  `;

  // Initialize all tracks
  initBamTrack();
  initBigWigTrack();
  initJunctionTrack();
  initNumericMode();
}

// Track instances
let bamTrack: BamTrack;
let bigWigTrack: BigWigTrack;
let junctionTrack: JunctionTrack;
let numericMode: NumericMode;

// Data
let bamData: ReturnType<typeof generateSampleBamData>;
let bigWigData: ReturnType<typeof generateSampleBigWigData>;
let junctionData: ReturnType<typeof generateSampleJunctionData>;
let numericData: ReturnType<typeof generateSampleNumericData>;

/**
 * Initialize BAM Track
 */
function initBamTrack(): void {
  bamTrack = new BamTrack('bam-track-container', {
    width: config.width,
    height: 250,
    showCoverage: true,
    showReads: true,
    colorBy: 'strand',
    onReadClick: (read) => {
      console.log('Clicked read:', read);
    },
  });

  // Generate sample data
  bamData = generateSampleBamData(config.chr, config.start, config.end, 300);
  bamTrack.loadData(bamData.reads, bamData.coverage);
  bamTrack.setRegion(config.chr, config.start, config.end);

  updateBamStats();
}

/**
 * Initialize BigWig Track
 */
function initBigWigTrack(): void {
  bigWigTrack = new BigWigTrack('bigwig-track-container', {
    width: config.width,
    height: 100,
    displayMode: 'area',
    color: BIGWIG_COLOR_PRESETS.chipseq,
    trackName: 'H3K4me3 ChIP-seq',
    smooth: 3,
  });

  bigWigData = generateSampleBigWigData(config.chr, config.start, config.end, 50, 'chipseq');
  bigWigTrack.loadData(bigWigData);
  bigWigTrack.setRegion(config.chr, config.start, config.end);
}

/**
 * Initialize Junction Track
 */
function initJunctionTrack(): void {
  junctionTrack = new JunctionTrack('junction-track-container', {
    width: config.width,
    height: 180,
    colorBy: 'annotated',
    showLabels: true,
    labelThreshold: 5,
    minReads: 5,
    onJunctionClick: (junction) => {
      console.log('Clicked junction:', junction);
    },
  });

  junctionData = generateSampleJunctionData(config.chr, config.start, config.end, 40);
  junctionTrack.loadData(junctionData);
  junctionTrack.setRegion(config.chr, config.start, config.end);

  updateJunctionStats();
}

/**
 * Initialize Numeric Mode
 */
function initNumericMode(): void {
  numericMode = new NumericMode('numeric-mode-container', {
    width: config.width,
    height: 300,
    displayMode: 'bar',
    scaleType: 'linear',
    colorPalette: 'viridis',
    showStats: true,
    showLabels: true,
    title: 'Gene Expression Values',
  });

  numericData = generateSampleNumericData(30);
  numericMode.loadData(numericData);
  numericMode.render();
}

/**
 * Update BAM Track settings
 */
(window as any).updateBamTrack = function (): void {
  const colorBy = (document.getElementById('bam-color-by') as HTMLSelectElement).value as any;
  const minMapQ = parseInt((document.getElementById('bam-min-mapq') as HTMLInputElement).value);
  const showCoverage =
    (document.getElementById('bam-show-coverage') as HTMLSelectElement).value === 'true';

  bamTrack.updateSettings({ colorBy, minMapQ, showCoverage });
  updateBamStats();
};

/**
 * Update BigWig Track settings
 */
(window as any).updateBigWigTrack = function (): void {
  const displayMode = (document.getElementById('bigwig-display') as HTMLSelectElement).value as any;
  const scaleMode = (document.getElementById('bigwig-scale') as HTMLSelectElement).value;
  const smooth = parseInt((document.getElementById('bigwig-smooth') as HTMLInputElement).value);

  let settings: any = { displayMode, smooth };

  if (scaleMode === 'log') {
    settings.scaleMode = 'log';
  } else if (scaleMode === 'fixed') {
    settings.scaleMode = 'fixed';
    settings.fixedMin = 0;
    settings.fixedMax = 100;
  } else {
    settings.scaleMode = 'auto';
  }

  bigWigTrack.updateSettings(settings);
};

/**
 * Regenerate BigWig data with different signal type
 */
(window as any).regenerateBigWigData = function (): void {
  const signalType = (document.getElementById('bigwig-signal') as HTMLSelectElement).value as any;

  bigWigData = generateSampleBigWigData(config.chr, config.start, config.end, 50, signalType);
  bigWigTrack.loadData(bigWigData);

  const colors: Record<string, string> = {
    chipseq: BIGWIG_COLOR_PRESETS.chipseq,
    rnaseq: BIGWIG_COLOR_PRESETS.rnaseq,
    atacseq: BIGWIG_COLOR_PRESETS.atacseq,
  };

  const names: Record<string, string> = {
    chipseq: 'H3K4me3 ChIP-seq',
    rnaseq: 'RNA-seq Coverage',
    atacseq: 'ATAC-seq Signal',
  };

  bigWigTrack.updateSettings({
    color: colors[signalType],
    trackName: names[signalType],
  });
};

/**
 * Update Junction Track settings
 */
(window as any).updateJunctionTrack = function (): void {
  const colorBy = (document.getElementById('junction-color-by') as HTMLSelectElement).value as any;
  const minReads = parseInt(
    (document.getElementById('junction-min-reads') as HTMLInputElement).value
  );
  const showLabels =
    (document.getElementById('junction-labels') as HTMLSelectElement).value === 'true';

  junctionTrack.updateSettings({ colorBy, minReads, showLabels });
  updateJunctionStats();
};

/**
 * Update Numeric Mode settings
 */
(window as any).updateNumericMode = function (): void {
  const displayMode = (document.getElementById('numeric-display') as HTMLSelectElement)
    .value as any;
  const scaleType = (document.getElementById('numeric-scale') as HTMLSelectElement).value as any;
  const colorPalette = (document.getElementById('numeric-palette') as HTMLSelectElement)
    .value as any;
  const sortBy = (document.getElementById('numeric-sort') as HTMLSelectElement).value as any;

  numericMode.updateSettings({ displayMode, scaleType, colorPalette, sortBy });
};

/**
 * Update BAM stats display
 */
function updateBamStats(): void {
  const reads = bamTrack.getReads();
  const statsContainer = document.getElementById('bam-stats');
  if (!statsContainer) return;

  const plusReads = reads.filter((r) => r.strand === '+').length;
  const minusReads = reads.filter((r) => r.strand === '-').length;
  const avgMapQ = reads.reduce((sum, r) => sum + r.mapq, 0) / reads.length;

  statsContainer.innerHTML = `
    <div class="stat-item">
      <div class="stat-label">Total Reads</div>
      <div class="stat-value">${reads.length.toLocaleString()}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">+ Strand</div>
      <div class="stat-value" style="color: #4a90d9">${plusReads.toLocaleString()}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">− Strand</div>
      <div class="stat-value" style="color: #d94a4a">${minusReads.toLocaleString()}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Avg MAPQ</div>
      <div class="stat-value">${avgMapQ.toFixed(1)}</div>
    </div>
  `;
}

/**
 * Update Junction stats display
 */
function updateJunctionStats(): void {
  const stats = junctionTrack.getStats();
  const statsContainer = document.getElementById('junction-stats');
  if (!statsContainer) return;

  statsContainer.innerHTML = `
    <div class="stat-item">
      <div class="stat-label">Total Junctions</div>
      <div class="stat-value">${stats.total.toLocaleString()}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Known</div>
      <div class="stat-value" style="color: #3498db">${stats.known.toLocaleString()}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Novel</div>
      <div class="stat-value" style="color: #e74c3c">${stats.novel.toLocaleString()}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Total Reads</div>
      <div class="stat-value">${stats.totalReads.toLocaleString()}</div>
    </div>
  `;
}

/**
 * Navigation functions
 */
(window as any).zoomIn = function (): void {
  const center = (config.start + config.end) / 2;
  const span = (config.end - config.start) / 4;
  config.start = Math.round(center - span);
  config.end = Math.round(center + span);
  updateAllTracks();
};

(window as any).zoomOut = function (): void {
  const center = (config.start + config.end) / 2;
  const span = config.end - config.start;
  config.start = Math.round(center - span);
  config.end = Math.round(center + span);
  updateAllTracks();
};

(window as any).panLeft = function (): void {
  const span = config.end - config.start;
  const shift = span * 0.3;
  config.start = Math.round(config.start - shift);
  config.end = Math.round(config.end - shift);
  updateAllTracks();
};

(window as any).panRight = function (): void {
  const span = config.end - config.start;
  const shift = span * 0.3;
  config.start = Math.round(config.start + shift);
  config.end = Math.round(config.end + shift);
  updateAllTracks();
};

(window as any).resetView = function (): void {
  config.start = 7570000;
  config.end = 7590000;
  updateAllTracks();
};

/**
 * Update all tracks with new region
 */
function updateAllTracks(): void {
  // Update region display
  const display = document.getElementById('region-display');
  if (display) {
    display.textContent = `${config.chr}:${config.start.toLocaleString()}-${config.end.toLocaleString()}`;
  }

  // Update all tracks
  bamTrack.setRegion(config.chr, config.start, config.end);
  bigWigTrack.setRegion(config.chr, config.start, config.end);
  junctionTrack.setRegion(config.chr, config.start, config.end);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initDemo);

// Export for testing
export { initDemo };
