import { DiscoDiagram } from './components/DiscoDiagram';
import type { DiscoSettings, GenomeReference, SampleData } from './types';
import './styles.css';

// Default settings
const defaultSettings: DiscoSettings = {
  radius: 300,
  padAngle: 0.005, // Minimal gap between chromosomes to avoid chords landing in gaps
  chromosomeWidth: 20,
  snvRingWidth: 15,
  cnvRingWidth: 20,
  lohRingWidth: 15,
  showLabels: true,
  showSnv: true,
  showCnv: true,
  showFusions: true,
  showLoh: true,
};

// Global state
let disco: DiscoDiagram | null = null;
let genome: GenomeReference | null = null;
let samplesData: Record<string, SampleData> = {};
let currentSettings = { ...defaultSettings };

/**
 * Initialize the application
 */
async function init(): Promise<void> {
  try {
    // Load genome reference
    const genomeResponse = await fetch('/data/genome.json');
    genome = await genomeResponse.json();

    // Load sample data
    const samplesResponse = await fetch('/data/samples.json');
    samplesData = await samplesResponse.json();

    // Create disco diagram
    disco = new DiscoDiagram('disco-container', genome!, currentSettings);

    // Load initial sample
    const initialSample = 'sample1';
    disco.loadData(samplesData[initialSample]);
    disco.renderLegend('legend');

    // Setup UI controls
    setupControls();

    console.log('Disco/Circos plot initialized');
  } catch (error) {
    console.error('Failed to initialize:', error);
    const container = document.getElementById('disco-container');
    if (container) {
      container.innerHTML = `
        <div style="color: #e74c3c; text-align: center; padding: 2rem;">
          <h3>Failed to load data</h3>
          <p>${error}</p>
        </div>
      `;
    }
  }
}

/**
 * Setup UI control listeners
 */
function setupControls(): void {
  // Sample selector
  const sampleSelect = document.getElementById('sample-select') as HTMLSelectElement;
  if (sampleSelect) {
    sampleSelect.addEventListener('change', () => {
      const sampleId = sampleSelect.value;
      if (disco && samplesData[sampleId]) {
        disco.loadData(samplesData[sampleId]);
        disco.renderLegend('legend');
      }
    });
  }

  // Track toggles
  setupCheckbox('show-snv', (checked) => {
    currentSettings.showSnv = checked;
    disco?.updateSettings({ showSnv: checked });
  });

  setupCheckbox('show-cnv', (checked) => {
    currentSettings.showCnv = checked;
    disco?.updateSettings({ showCnv: checked });
  });

  setupCheckbox('show-fusions', (checked) => {
    currentSettings.showFusions = checked;
    disco?.updateSettings({ showFusions: checked });
  });

  setupCheckbox('show-loh', (checked) => {
    currentSettings.showLoh = checked;
    disco?.updateSettings({ showLoh: checked });
  });

  setupCheckbox('show-labels', (checked) => {
    currentSettings.showLabels = checked;
    disco?.updateSettings({ showLabels: checked });
  });

  // Radius slider
  const radiusSlider = document.getElementById('radius-slider') as HTMLInputElement;
  const radiusValue = document.getElementById('radius-value');
  if (radiusSlider && radiusValue) {
    radiusSlider.addEventListener('input', () => {
      const radius = parseInt(radiusSlider.value);
      radiusValue.textContent = radius.toString();
      currentSettings.radius = radius;
      disco?.updateSettings({ radius });
    });
  }
}

/**
 * Helper to setup checkbox listeners
 */
function setupCheckbox(id: string, callback: (checked: boolean) => void): void {
  const checkbox = document.getElementById(id) as HTMLInputElement;
  if (checkbox) {
    checkbox.addEventListener('change', () => {
      callback(checkbox.checked);
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
