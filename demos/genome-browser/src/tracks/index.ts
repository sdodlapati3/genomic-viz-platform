/**
 * Genome Browser Tracks - Index
 *
 * Export all specialized genomic visualization tracks:
 * - BamTrack: Read alignment visualization
 * - BigWigTrack: Signal/coverage visualization
 * - JunctionTrack: Splice junction arcs
 *
 * Each track is designed to integrate with the genome browser
 * and supports synchronized navigation and zooming.
 */

// BAM Track - Read alignments
export {
  BamTrack,
  BamRead,
  CigarOp,
  CoverageData,
  BamTrackSettings,
  bamTrackStyles,
  generateSampleBamData,
} from './BamTrack';

// BigWig Track - Signal/coverage
export {
  BigWigTrack,
  BigWigOverlay,
  BigWigData,
  BigWigTrackSettings,
  BIGWIG_COLOR_PRESETS,
  bigWigTrackStyles,
  generateSampleBigWigData,
} from './BigWigTrack';

// Junction Track - Splice junctions
export {
  JunctionTrack,
  SpliceJunction,
  JunctionTrackSettings,
  junctionTrackStyles,
  generateSampleJunctionData,
} from './JunctionTrack';
