import { CNVTrack } from './components/CNVTrack';
import { getSample } from './data/datasets';
import { CNVConfig } from './types';

// Initial configuration
const config: CNVConfig = {
  container: '#cnv-track',
  width: 1000,
  height: 550,
  margin: { top: 30, right: 30, bottom: 60, left: 60 },
  view: 'linear',
  colorBy: 'gainloss',
  chromosome: 'all',
  showGenes: true,
  showCytobands: true,
  log2Threshold: 0.3,
};

// Initialize with first sample
let currentSample = getSample('tumor1');
let track = new CNVTrack(config, currentSample);

// Sample selector
const sampleSelect = document.getElementById('sample-select') as HTMLSelectElement;
sampleSelect.addEventListener('change', () => {
  currentSample = getSample(sampleSelect.value);
  track.updateSample(currentSample);
});

// Chromosome selector
const chromosomeSelect = document.getElementById('chromosome-select') as HTMLSelectElement;
chromosomeSelect.addEventListener('change', () => {
  config.chromosome = chromosomeSelect.value;
  track.updateConfig({ chromosome: config.chromosome });
});

// View selector
const viewSelect = document.getElementById('view-select') as HTMLSelectElement;
viewSelect.addEventListener('change', () => {
  config.view = viewSelect.value as 'linear' | 'heatmap' | 'segments';
  track.updateConfig({ view: config.view });
});

// Color selector
const colorSelect = document.getElementById('color-select') as HTMLSelectElement;
colorSelect.addEventListener('change', () => {
  config.colorBy = colorSelect.value as 'gainloss' | 'logr' | 'segment';
  track.updateConfig({ colorBy: config.colorBy });
});

// Show genes checkbox
const showGenesCheckbox = document.getElementById('show-genes') as HTMLInputElement;
showGenesCheckbox.addEventListener('change', () => {
  config.showGenes = showGenesCheckbox.checked;
  track.updateConfig({ showGenes: config.showGenes });
});

// Show cytobands checkbox
const showCytobandsCheckbox = document.getElementById('show-cytobands') as HTMLInputElement;
showCytobandsCheckbox.addEventListener('change', () => {
  config.showCytobands = showCytobandsCheckbox.checked;
  track.updateConfig({ showCytobands: config.showCytobands });
});

// Handle window resize
let resizeTimeout: number;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    track.updateSample(currentSample);
  }, 250);
});

console.log('📊 CNV Track Visualization Demo loaded');
console.log('Sample:', currentSample.name);
console.log('Segments:', currentSample.metadata.nSegments);
