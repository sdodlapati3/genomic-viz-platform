import type { Chromosome, GenomeReference, DiscoSettings } from '../types';

/**
 * Reference class handles chromosome layout and coordinate transformations
 * Converts genomic positions to angles on the circular plot
 */
export class Reference {
  public chromosomes: Chromosome[] = [];
  public chromosomeMap: Map<string, Chromosome> = new Map();
  public totalSize: number = 0;

  private settings: DiscoSettings;
  private genome: GenomeReference;

  constructor(genome: GenomeReference, settings: DiscoSettings) {
    this.genome = genome;
    this.settings = settings;
    this.buildChromosomes();
  }

  /**
   * Build chromosome arcs with proper angles
   */
  private buildChromosomes(): void {
    const { order, chromosomes: sizes } = this.genome;

    // Calculate total genome size
    this.totalSize = order.reduce((sum, chr) => sum + (sizes[chr] || 0), 0);

    // Calculate angles
    const numChromosomes = order.length;
    const totalPadAngle = numChromosomes * this.settings.padAngle;
    const availableAngle = 2 * Math.PI - totalPadAngle;

    let currentAngle = this.settings.padAngle / 2;

    for (const chrName of order) {
      const size = sizes[chrName] || 0;
      const chrAngle = availableAngle * (size / this.totalSize);

      const startAngle = currentAngle;
      const endAngle = currentAngle + chrAngle;
      const midAngle = (startAngle + endAngle) / 2;

      const chromosome: Chromosome = {
        name: chrName,
        size,
        startAngle,
        endAngle,
        angle: midAngle,
        // Chromosome ring is now on the INSIDE (data stacks outward)
        innerRadius:
          this.settings.radius -
          this.settings.cnvRingWidth -
          this.settings.snvRingWidth -
          this.settings.chromosomeWidth,
        outerRadius: this.settings.radius - this.settings.cnvRingWidth - this.settings.snvRingWidth,
        color: this.getChromosomeColor(chrName),
        text: chrName.replace('chr', ''),
      };

      this.chromosomes.push(chromosome);
      this.chromosomeMap.set(chrName, chromosome);

      currentAngle = endAngle + this.settings.padAngle;
    }
  }

  /**
   * Convert genomic position to angle
   */
  public positionToAngle(chr: string, position: number): number | null {
    const chromosome = this.chromosomeMap.get(chr);
    if (!chromosome) return null;

    const fraction = position / chromosome.size;
    const angle = chromosome.startAngle + fraction * (chromosome.endAngle - chromosome.startAngle);

    return angle;
  }

  /**
   * Convert genomic range to start/end angles
   */
  public rangeToAngles(
    chr: string,
    start: number,
    end: number
  ): { startAngle: number; endAngle: number } | null {
    const startAngle = this.positionToAngle(chr, start);
    const endAngle = this.positionToAngle(chr, end);

    if (startAngle === null || endAngle === null) return null;

    return { startAngle, endAngle };
  }

  /**
   * Get alternating colors for chromosomes
   */
  private getChromosomeColor(chr: string): string {
    const chrNum = chr.replace('chr', '');

    // Special colors for X, Y, M
    if (chrNum === 'X') return '#9b59b6';
    if (chrNum === 'Y') return '#3498db';
    if (chrNum === 'M' || chrNum === 'MT') return '#27ae60';

    const num = parseInt(chrNum);
    if (isNaN(num)) return '#555';

    // Alternating color scheme
    return num % 2 === 0 ? '#3a3a4a' : '#2a2a3a';
  }

  /**
   * Update settings and rebuild
   */
  public updateSettings(settings: Partial<DiscoSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.chromosomes = [];
    this.chromosomeMap.clear();
    this.buildChromosomes();
  }
}
