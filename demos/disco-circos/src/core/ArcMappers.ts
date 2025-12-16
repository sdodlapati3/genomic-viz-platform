import type {
  SnvData,
  SnvArc,
  CnvData,
  CnvArc,
  FusionData,
  FusionChord,
  LohData,
  LohArc,
  DiscoSettings,
} from '../types';
import { Reference } from './Reference';
import { MUTATION_COLORS, CNV_COLORS, LOH_COLORS, getFusionColor } from './Colors';

/**
 * Map SNV data to arc objects
 */
export class SnvArcMapper {
  private reference: Reference;
  private innerRadius: number;
  private ringWidth: number;

  constructor(reference: Reference, settings: DiscoSettings) {
    this.reference = reference;

    // SNV ring stacks OUTSIDE the chromosome ring
    this.ringWidth = settings.snvRingWidth;
    const chrOuterRadius = settings.radius - settings.cnvRingWidth - settings.snvRingWidth;
    this.innerRadius = chrOuterRadius; // SNV starts where chromosome ends
  }

  public map(mutations: SnvData[]): SnvArc[] {
    const arcs: SnvArc[] = [];
    const minArcAngle = 0.015; // Minimum visible arc angle

    for (const mut of mutations) {
      const angle = this.reference.positionToAngle(mut.chr, mut.pos);
      if (angle === null) continue;

      const arc: SnvArc = {
        startAngle: angle - minArcAngle / 2,
        endAngle: angle + minArcAngle / 2,
        innerRadius: this.innerRadius,
        outerRadius: this.innerRadius + this.ringWidth,
        color: MUTATION_COLORS[mut.class] || MUTATION_COLORS.other,
        chr: mut.chr,
        pos: mut.pos,
        gene: mut.gene,
        mname: mut.mname,
        mutClass: mut.class,
        text: mut.gene,
      };

      arcs.push(arc);
    }

    return arcs;
  }

  public getInnerRadius(): number {
    return this.innerRadius;
  }

  public getOuterRadius(): number {
    return this.innerRadius + this.ringWidth;
  }
}

/**
 * Map CNV data to arc objects
 */
export class CnvArcMapper {
  private reference: Reference;
  private innerRadius: number;
  private ringWidth: number;

  constructor(reference: Reference, settings: DiscoSettings) {
    this.reference = reference;

    // CNV ring stacks OUTSIDE the SNV ring (outermost)
    this.ringWidth = settings.cnvRingWidth;
    const snvOuterRadius = settings.radius - settings.cnvRingWidth;
    this.innerRadius = snvOuterRadius; // CNV starts where SNV ends
  }

  public map(cnvs: CnvData[]): CnvArc[] {
    const arcs: CnvArc[] = [];

    for (const cnv of cnvs) {
      const angles = this.reference.rangeToAngles(cnv.chr, cnv.start, cnv.end);
      if (!angles) continue;

      // Ensure minimum visible arc
      let { startAngle, endAngle } = angles;
      const minArcAngle = 0.01;
      if (endAngle - startAngle < minArcAngle) {
        const mid = (startAngle + endAngle) / 2;
        startAngle = mid - minArcAngle / 2;
        endAngle = mid + minArcAngle / 2;
      }

      const type = cnv.value >= 0 ? 'gain' : 'loss';
      const color = type === 'gain' ? CNV_COLORS.gain : CNV_COLORS.loss;

      // Vary opacity based on magnitude
      const magnitude = Math.min(Math.abs(cnv.value), 2);
      const opacity = 0.4 + (magnitude / 2) * 0.6;

      const arc: CnvArc = {
        startAngle,
        endAngle,
        innerRadius: this.innerRadius,
        outerRadius: this.innerRadius + this.ringWidth,
        color: color,
        chr: cnv.chr,
        start: cnv.start,
        end: cnv.end,
        value: cnv.value,
        type,
        text: `${cnv.value > 0 ? '+' : ''}${cnv.value.toFixed(2)}`,
      };

      // Apply opacity to color
      arc.color = this.applyOpacity(color, opacity);

      arcs.push(arc);
    }

    return arcs;
  }

  public getInnerRadius(): number {
    return this.innerRadius;
  }

  public getOuterRadius(): number {
    return this.innerRadius + this.ringWidth;
  }

  private applyOpacity(hex: string, opacity: number): string {
    // Convert hex to rgba
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}

/**
 * Map Fusion data to chord objects
 */
export class FusionChordMapper {
  private reference: Reference;
  private innerRadius: number;
  private chromosomeInnerRadius: number;

  constructor(reference: Reference, settings: DiscoSettings) {
    this.reference = reference;

    // Chromosome ring inner radius (chords connect here)
    this.chromosomeInnerRadius =
      settings.radius - settings.cnvRingWidth - settings.snvRingWidth - settings.chromosomeWidth;

    // Control radius for bezier curves (towards center)
    this.innerRadius = this.chromosomeInnerRadius * 0.3;
  }

  public map(fusions: FusionData[]): FusionChord[] {
    const chords: FusionChord[] = [];
    const arcWidth = 0.02; // Width of each chord endpoint

    for (const fusion of fusions) {
      const angleA = this.reference.positionToAngle(fusion.chrA, fusion.posA);
      const angleB = this.reference.positionToAngle(fusion.chrB, fusion.posB);

      if (angleA === null || angleB === null) continue;

      const chord: FusionChord = {
        source: {
          startAngle: angleA - arcWidth / 2,
          endAngle: angleA + arcWidth / 2,
        },
        target: {
          startAngle: angleB - arcWidth / 2,
          endAngle: angleB + arcWidth / 2,
        },
        chrA: fusion.chrA,
        posA: fusion.posA,
        geneA: fusion.geneA,
        chrB: fusion.chrB,
        posB: fusion.posB,
        geneB: fusion.geneB,
        color: getFusionColor(fusion.geneA, fusion.geneB),
      };

      chords.push(chord);
    }

    return chords;
  }

  public getInnerRadius(): number {
    return this.innerRadius;
  }

  public getChromosomeInnerRadius(): number {
    return this.chromosomeInnerRadius;
  }
}

/**
 * Map LOH data to arc objects
 * Loss of Heterozygosity shows regions where B-allele frequency deviates from 0.5
 */
export class LohArcMapper {
  private reference: Reference;
  private innerRadius: number;
  private ringWidth: number;

  constructor(reference: Reference, settings: DiscoSettings) {
    this.reference = reference;

    // LOH ring is between CNV and chromosome ring
    this.ringWidth = settings.lohRingWidth;
    // LOH starts inside the CNV ring
    const cnvInnerRadius = settings.radius - settings.cnvRingWidth;
    this.innerRadius = cnvInnerRadius - this.ringWidth;
  }

  public map(lohData: LohData[]): LohArc[] {
    const arcs: LohArc[] = [];

    for (const loh of lohData) {
      const angles = this.reference.rangeToAngles(loh.chr, loh.start, loh.end);
      if (!angles) continue;

      // Ensure minimum visible arc
      let { startAngle, endAngle } = angles;
      const minArcAngle = 0.01;
      if (endAngle - startAngle < minArcAngle) {
        const mid = (startAngle + endAngle) / 2;
        startAngle = mid - minArcAngle / 2;
        endAngle = mid + minArcAngle / 2;
      }

      // Determine LOH type based on copy-neutral flag
      const isCopyNeutral = loh.copyNeutral || false;
      const type = isCopyNeutral ? 'cnloh' : 'loh';
      const baseColor = isCopyNeutral ? LOH_COLORS.cnloh : LOH_COLORS.loh;

      // Calculate opacity based on BAF deviation from 0.5
      // BAF close to 0 or 1 = strong LOH signal
      const bafDeviation = Math.abs(loh.bafValue - 0.5) * 2; // Normalize to 0-1
      const opacity = 0.4 + bafDeviation * 0.6;

      const arc: LohArc = {
        startAngle,
        endAngle,
        innerRadius: this.innerRadius,
        outerRadius: this.innerRadius + this.ringWidth,
        color: this.applyOpacity(baseColor, opacity),
        chr: loh.chr,
        start: loh.start,
        end: loh.end,
        bafValue: loh.bafValue,
        copyNeutral: isCopyNeutral,
        type,
        text: `BAF: ${loh.bafValue.toFixed(2)}`,
      };

      arcs.push(arc);
    }

    return arcs;
  }

  public getInnerRadius(): number {
    return this.innerRadius;
  }

  public getOuterRadius(): number {
    return this.innerRadius + this.ringWidth;
  }

  private applyOpacity(hex: string, opacity: number): string {
    // Convert hex to rgba
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}
