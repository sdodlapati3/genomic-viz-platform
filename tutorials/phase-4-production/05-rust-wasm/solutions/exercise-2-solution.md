# Exercise 2 Solution: Smith-Waterman Sequence Alignment

## Complete Rust Implementation

### `src/rust/src/alignment.rs`

```rust
//! Smith-Waterman local sequence alignment implementation
//!
//! Provides high-performance local alignment for DNA/RNA sequences
//! using dynamic programming with optional affine gap penalties.

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

/// Direction for traceback
#[derive(Clone, Copy, PartialEq, Debug)]
enum Direction {
    None,
    Diagonal,
    Up,
    Left,
}

/// Alignment result with full details
#[derive(Clone, Serialize, Deserialize)]
pub struct AlignmentResult {
    /// Alignment score
    pub score: i32,
    /// Aligned sequence 1 (with gaps as '-')
    pub aligned_seq1: String,
    /// Aligned sequence 2 (with gaps as '-')
    pub aligned_seq2: String,
    /// Match/mismatch/gap string for visualization
    pub midline: String,
    /// Start position in sequence 1 (0-indexed)
    pub start_pos1: usize,
    /// Start position in sequence 2 (0-indexed)
    pub start_pos2: usize,
    /// End position in sequence 1 (0-indexed)
    pub end_pos1: usize,
    /// End position in sequence 2 (0-indexed)
    pub end_pos2: usize,
    /// Sequence identity (fraction of matches)
    pub identity: f64,
    /// Number of matches
    pub matches: usize,
    /// Number of mismatches
    pub mismatches: usize,
    /// Number of gaps
    pub gaps: usize,
    /// Alignment length
    pub alignment_length: usize,
}

/// WASM-compatible wrapper for alignment result
#[wasm_bindgen]
pub struct WasmAlignmentResult {
    inner: AlignmentResult,
}

#[wasm_bindgen]
impl WasmAlignmentResult {
    #[wasm_bindgen(getter)]
    pub fn score(&self) -> i32 {
        self.inner.score
    }

    #[wasm_bindgen(getter)]
    pub fn identity(&self) -> f64 {
        self.inner.identity
    }

    #[wasm_bindgen(getter)]
    pub fn start_pos1(&self) -> usize {
        self.inner.start_pos1
    }

    #[wasm_bindgen(getter)]
    pub fn start_pos2(&self) -> usize {
        self.inner.start_pos2
    }

    #[wasm_bindgen(getter)]
    pub fn end_pos1(&self) -> usize {
        self.inner.end_pos1
    }

    #[wasm_bindgen(getter)]
    pub fn end_pos2(&self) -> usize {
        self.inner.end_pos2
    }

    #[wasm_bindgen(getter)]
    pub fn aligned_seq1(&self) -> String {
        self.inner.aligned_seq1.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn aligned_seq2(&self) -> String {
        self.inner.aligned_seq2.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn midline(&self) -> String {
        self.inner.midline.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn matches(&self) -> usize {
        self.inner.matches
    }

    #[wasm_bindgen(getter)]
    pub fn mismatches(&self) -> usize {
        self.inner.mismatches
    }

    #[wasm_bindgen(getter)]
    pub fn gaps(&self) -> usize {
        self.inner.gaps
    }

    /// Get full result as JSON
    pub fn to_json(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.inner).unwrap()
    }
}

/// Smith-Waterman local alignment with linear gap penalty
///
/// # Arguments
/// * `seq1` - First sequence (uppercase DNA: A, C, G, T)
/// * `seq2` - Second sequence
/// * `match_score` - Score for matching bases (typically positive, e.g., 2)
/// * `mismatch_penalty` - Penalty for mismatches (typically negative, e.g., -1)
/// * `gap_penalty` - Penalty for gaps (typically negative, e.g., -1)
#[wasm_bindgen]
pub fn smith_waterman(
    seq1: &str,
    seq2: &str,
    match_score: i32,
    mismatch_penalty: i32,
    gap_penalty: i32,
) -> WasmAlignmentResult {
    let result = smith_waterman_impl(seq1, seq2, match_score, mismatch_penalty, gap_penalty);
    WasmAlignmentResult { inner: result }
}

fn smith_waterman_impl(
    seq1: &str,
    seq2: &str,
    match_score: i32,
    mismatch_penalty: i32,
    gap_penalty: i32,
) -> AlignmentResult {
    let s1: Vec<char> = seq1.chars().collect();
    let s2: Vec<char> = seq2.chars().collect();
    let m = s1.len();
    let n = s2.len();

    // Handle empty sequences
    if m == 0 || n == 0 {
        return AlignmentResult {
            score: 0,
            aligned_seq1: String::new(),
            aligned_seq2: String::new(),
            midline: String::new(),
            start_pos1: 0,
            start_pos2: 0,
            end_pos1: 0,
            end_pos2: 0,
            identity: 0.0,
            matches: 0,
            mismatches: 0,
            gaps: 0,
            alignment_length: 0,
        };
    }

    // Initialize scoring matrix and traceback matrix
    let mut score_matrix = vec![vec![0i32; n + 1]; m + 1];
    let mut traceback = vec![vec![Direction::None; n + 1]; m + 1];

    // Track maximum score position
    let mut max_score = 0;
    let mut max_pos = (0, 0);

    // Fill the matrix
    for i in 1..=m {
        for j in 1..=n {
            // Calculate match/mismatch score
            let match_val = if s1[i - 1] == s2[j - 1] {
                match_score
            } else {
                mismatch_penalty
            };

            // Calculate scores from three directions
            let diagonal = score_matrix[i - 1][j - 1] + match_val;
            let up = score_matrix[i - 1][j] + gap_penalty;
            let left = score_matrix[i][j - 1] + gap_penalty;

            // Find maximum (including 0 for local alignment)
            let (score, direction) = if diagonal >= up && diagonal >= left && diagonal > 0 {
                (diagonal, Direction::Diagonal)
            } else if up >= left && up > 0 {
                (up, Direction::Up)
            } else if left > 0 {
                (left, Direction::Left)
            } else {
                (0, Direction::None)
            };

            score_matrix[i][j] = score;
            traceback[i][j] = direction;

            // Update maximum
            if score > max_score {
                max_score = score;
                max_pos = (i, j);
            }
        }
    }

    // Traceback from maximum score position
    let (end_i, end_j) = max_pos;
    let mut aligned1 = Vec::new();
    let mut aligned2 = Vec::new();
    let mut midline = Vec::new();

    let mut i = end_i;
    let mut j = end_j;

    while i > 0 && j > 0 && score_matrix[i][j] > 0 {
        match traceback[i][j] {
            Direction::Diagonal => {
                let c1 = s1[i - 1];
                let c2 = s2[j - 1];
                aligned1.push(c1);
                aligned2.push(c2);
                midline.push(if c1 == c2 { '|' } else { 'x' });
                i -= 1;
                j -= 1;
            }
            Direction::Up => {
                aligned1.push(s1[i - 1]);
                aligned2.push('-');
                midline.push(' ');
                i -= 1;
            }
            Direction::Left => {
                aligned1.push('-');
                aligned2.push(s2[j - 1]);
                midline.push(' ');
                j -= 1;
            }
            Direction::None => break,
        }
    }

    // Reverse the alignments (built backwards during traceback)
    aligned1.reverse();
    aligned2.reverse();
    midline.reverse();

    // Calculate statistics
    let alignment_length = aligned1.len();
    let matches = midline.iter().filter(|&&c| c == '|').count();
    let mismatches = midline.iter().filter(|&&c| c == 'x').count();
    let gaps = midline.iter().filter(|&&c| c == ' ').count();
    let identity = if alignment_length > 0 {
        matches as f64 / alignment_length as f64
    } else {
        0.0
    };

    AlignmentResult {
        score: max_score,
        aligned_seq1: aligned1.into_iter().collect(),
        aligned_seq2: aligned2.into_iter().collect(),
        midline: midline.into_iter().collect(),
        start_pos1: i,
        start_pos2: j,
        end_pos1: end_i - 1,
        end_pos2: end_j - 1,
        identity,
        matches,
        mismatches,
        gaps,
        alignment_length,
    }
}

/// Smith-Waterman with affine gap penalties
///
/// Uses separate penalties for gap opening and gap extension,
/// which is more biologically realistic.
///
/// # Arguments
/// * `gap_open` - Penalty for opening a gap (e.g., -10)
/// * `gap_extend` - Penalty for extending a gap (e.g., -1)
#[wasm_bindgen]
pub fn smith_waterman_affine(
    seq1: &str,
    seq2: &str,
    match_score: i32,
    mismatch_penalty: i32,
    gap_open: i32,
    gap_extend: i32,
) -> WasmAlignmentResult {
    let result = smith_waterman_affine_impl(
        seq1, seq2, match_score, mismatch_penalty, gap_open, gap_extend
    );
    WasmAlignmentResult { inner: result }
}

fn smith_waterman_affine_impl(
    seq1: &str,
    seq2: &str,
    match_score: i32,
    mismatch_penalty: i32,
    gap_open: i32,
    gap_extend: i32,
) -> AlignmentResult {
    let s1: Vec<char> = seq1.chars().collect();
    let s2: Vec<char> = seq2.chars().collect();
    let m = s1.len();
    let n = s2.len();

    if m == 0 || n == 0 {
        return AlignmentResult {
            score: 0,
            aligned_seq1: String::new(),
            aligned_seq2: String::new(),
            midline: String::new(),
            start_pos1: 0,
            start_pos2: 0,
            end_pos1: 0,
            end_pos2: 0,
            identity: 0.0,
            matches: 0,
            mismatches: 0,
            gaps: 0,
            alignment_length: 0,
        };
    }

    const NEG_INF: i32 = i32::MIN / 2;

    // Three matrices for affine gaps:
    // M[i,j] = score ending with match/mismatch
    // X[i,j] = score ending with gap in seq1 (insertion)
    // Y[i,j] = score ending with gap in seq2 (deletion)
    let mut m_matrix = vec![vec![0i32; n + 1]; m + 1];
    let mut x_matrix = vec![vec![NEG_INF; n + 1]; m + 1];
    let mut y_matrix = vec![vec![NEG_INF; n + 1]; m + 1];

    #[derive(Clone, Copy)]
    enum TraceType {
        None,
        M,
        X,
        Y,
    }

    let mut traceback = vec![vec![(TraceType::None, Direction::None); n + 1]; m + 1];

    let mut max_score = 0;
    let mut max_pos = (0, 0);
    let mut max_type = TraceType::M;

    for i in 1..=m {
        for j in 1..=n {
            let match_val = if s1[i - 1] == s2[j - 1] {
                match_score
            } else {
                mismatch_penalty
            };

            // Update X (gap in seq2 - deletion)
            let x_from_m = m_matrix[i - 1][j] + gap_open + gap_extend;
            let x_from_x = x_matrix[i - 1][j] + gap_extend;
            x_matrix[i][j] = x_from_m.max(x_from_x).max(0);

            // Update Y (gap in seq1 - insertion)
            let y_from_m = m_matrix[i][j - 1] + gap_open + gap_extend;
            let y_from_y = y_matrix[i][j - 1] + gap_extend;
            y_matrix[i][j] = y_from_m.max(y_from_y).max(0);

            // Update M (match/mismatch)
            let m_from_m = m_matrix[i - 1][j - 1] + match_val;
            let m_from_x = x_matrix[i - 1][j - 1] + match_val;
            let m_from_y = y_matrix[i - 1][j - 1] + match_val;
            m_matrix[i][j] = m_from_m.max(m_from_x).max(m_from_y).max(0);

            // Store traceback info
            if m_matrix[i][j] == m_from_m && m_matrix[i][j] > 0 {
                traceback[i][j] = (TraceType::M, Direction::Diagonal);
            } else if m_matrix[i][j] == m_from_x && m_matrix[i][j] > 0 {
                traceback[i][j] = (TraceType::X, Direction::Diagonal);
            } else if m_matrix[i][j] == m_from_y && m_matrix[i][j] > 0 {
                traceback[i][j] = (TraceType::Y, Direction::Diagonal);
            }

            // Track maximum across all matrices
            for (score, stype) in [
                (m_matrix[i][j], TraceType::M),
                (x_matrix[i][j], TraceType::X),
                (y_matrix[i][j], TraceType::Y),
            ] {
                if score > max_score {
                    max_score = score;
                    max_pos = (i, j);
                    max_type = stype;
                }
            }
        }
    }

    // Traceback (simplified for affine - just follow best path)
    let (end_i, end_j) = max_pos;
    let mut aligned1 = Vec::new();
    let mut aligned2 = Vec::new();
    let mut midline = Vec::new();

    let mut i = end_i;
    let mut j = end_j;

    // Simple traceback using M matrix direction
    while i > 0 && j > 0 && m_matrix[i][j] > 0 {
        let c1 = s1[i - 1];
        let c2 = s2[j - 1];

        // Determine if this is a match/mismatch or gap
        let diag = m_matrix[i - 1][j - 1];
        let up = if i > 0 { m_matrix[i - 1][j] } else { 0 };
        let left = if j > 0 { m_matrix[i][j - 1] } else { 0 };

        let match_val = if c1 == c2 { match_score } else { mismatch_penalty };

        if m_matrix[i][j] == diag + match_val || (i > 0 && j > 0) {
            aligned1.push(c1);
            aligned2.push(c2);
            midline.push(if c1 == c2 { '|' } else { 'x' });
            i -= 1;
            j -= 1;
        } else if m_matrix[i][j] == up + gap_open + gap_extend {
            aligned1.push(c1);
            aligned2.push('-');
            midline.push(' ');
            i -= 1;
        } else {
            aligned1.push('-');
            aligned2.push(c2);
            midline.push(' ');
            j -= 1;
        }

        if m_matrix[i][j] == 0 {
            break;
        }
    }

    aligned1.reverse();
    aligned2.reverse();
    midline.reverse();

    let alignment_length = aligned1.len();
    let matches = midline.iter().filter(|&&c| c == '|').count();
    let mismatches = midline.iter().filter(|&&c| c == 'x').count();
    let gaps = midline.iter().filter(|&&c| c == ' ').count();
    let identity = if alignment_length > 0 {
        matches as f64 / alignment_length as f64
    } else {
        0.0
    };

    AlignmentResult {
        score: max_score,
        aligned_seq1: aligned1.into_iter().collect(),
        aligned_seq2: aligned2.into_iter().collect(),
        midline: midline.into_iter().collect(),
        start_pos1: i,
        start_pos2: j,
        end_pos1: end_i - 1,
        end_pos2: end_j - 1,
        identity,
        matches,
        mismatches,
        gaps,
        alignment_length,
    }
}

/// Needleman-Wunsch global alignment
///
/// Aligns entire sequences end-to-end.
#[wasm_bindgen]
pub fn needleman_wunsch(
    seq1: &str,
    seq2: &str,
    match_score: i32,
    mismatch_penalty: i32,
    gap_penalty: i32,
) -> WasmAlignmentResult {
    let s1: Vec<char> = seq1.chars().collect();
    let s2: Vec<char> = seq2.chars().collect();
    let m = s1.len();
    let n = s2.len();

    if m == 0 && n == 0 {
        return WasmAlignmentResult {
            inner: AlignmentResult {
                score: 0,
                aligned_seq1: String::new(),
                aligned_seq2: String::new(),
                midline: String::new(),
                start_pos1: 0,
                start_pos2: 0,
                end_pos1: 0,
                end_pos2: 0,
                identity: 0.0,
                matches: 0,
                mismatches: 0,
                gaps: 0,
                alignment_length: 0,
            }
        };
    }

    // Initialize scoring matrix
    let mut score_matrix = vec![vec![0i32; n + 1]; m + 1];
    let mut traceback = vec![vec![Direction::None; n + 1]; m + 1];

    // Initialize first row and column (global alignment differs from local here)
    for i in 1..=m {
        score_matrix[i][0] = gap_penalty * i as i32;
        traceback[i][0] = Direction::Up;
    }
    for j in 1..=n {
        score_matrix[0][j] = gap_penalty * j as i32;
        traceback[0][j] = Direction::Left;
    }

    // Fill matrix
    for i in 1..=m {
        for j in 1..=n {
            let match_val = if s1[i - 1] == s2[j - 1] {
                match_score
            } else {
                mismatch_penalty
            };

            let diagonal = score_matrix[i - 1][j - 1] + match_val;
            let up = score_matrix[i - 1][j] + gap_penalty;
            let left = score_matrix[i][j - 1] + gap_penalty;

            let (score, direction) = if diagonal >= up && diagonal >= left {
                (diagonal, Direction::Diagonal)
            } else if up >= left {
                (up, Direction::Up)
            } else {
                (left, Direction::Left)
            };

            score_matrix[i][j] = score;
            traceback[i][j] = direction;
        }
    }

    // Traceback from bottom-right corner
    let mut aligned1 = Vec::new();
    let mut aligned2 = Vec::new();
    let mut midline = Vec::new();

    let mut i = m;
    let mut j = n;

    while i > 0 || j > 0 {
        match traceback[i][j] {
            Direction::Diagonal => {
                let c1 = s1[i - 1];
                let c2 = s2[j - 1];
                aligned1.push(c1);
                aligned2.push(c2);
                midline.push(if c1 == c2 { '|' } else { 'x' });
                i -= 1;
                j -= 1;
            }
            Direction::Up => {
                aligned1.push(s1[i - 1]);
                aligned2.push('-');
                midline.push(' ');
                i -= 1;
            }
            Direction::Left | Direction::None => {
                aligned1.push('-');
                aligned2.push(s2[j - 1]);
                midline.push(' ');
                j -= 1;
            }
        }
    }

    aligned1.reverse();
    aligned2.reverse();
    midline.reverse();

    let alignment_length = aligned1.len();
    let matches = midline.iter().filter(|&&c| c == '|').count();
    let mismatches = midline.iter().filter(|&&c| c == 'x').count();
    let gaps = midline.iter().filter(|&&c| c == ' ').count();
    let identity = if alignment_length > 0 {
        matches as f64 / alignment_length as f64
    } else {
        0.0
    };

    WasmAlignmentResult {
        inner: AlignmentResult {
            score: score_matrix[m][n],
            aligned_seq1: aligned1.into_iter().collect(),
            aligned_seq2: aligned2.into_iter().collect(),
            midline: midline.into_iter().collect(),
            start_pos1: 0,
            start_pos2: 0,
            end_pos1: m - 1,
            end_pos2: n - 1,
            identity,
            matches,
            mismatches,
            gaps,
            alignment_length,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_perfect_match() {
        let result = smith_waterman_impl("ACGT", "ACGT", 2, -1, -1);
        assert_eq!(result.score, 8);
        assert_eq!(result.identity, 1.0);
        assert_eq!(result.aligned_seq1, "ACGT");
        assert_eq!(result.aligned_seq2, "ACGT");
    }

    #[test]
    fn test_with_mismatch() {
        let result = smith_waterman_impl("ACGT", "ACAT", 2, -1, -1);
        assert!(result.score > 0);
        assert!(result.identity < 1.0);
    }

    #[test]
    fn test_with_gap() {
        let result = smith_waterman_impl("ACGTACGT", "ACGACGT", 2, -1, -2);
        assert!(result.score > 0);
        assert!(result.gaps > 0 || result.alignment_length < 8);
    }

    #[test]
    fn test_no_similarity() {
        let result = smith_waterman_impl("AAAA", "TTTT", 2, -1, -1);
        assert_eq!(result.score, 0);
    }

    #[test]
    fn test_global_alignment() {
        let result = needleman_wunsch("GCATGCU", "GATTACA", 1, -1, -1);
        // Global alignment should span entire sequences
        assert!(result.inner.alignment_length >= 7);
    }
}
```

## JavaScript Interface

### `src/js/alignment.js`

```javascript
/**
 * Sequence Alignment JavaScript Interface
 *
 * Provides high-level API for sequence alignment functions
 */

import init, { smith_waterman, smith_waterman_affine, needleman_wunsch } from '../rust/pkg';

let wasmInitialized = false;

/**
 * Initialize WASM module
 */
export async function initAlignment() {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

/**
 * Perform Smith-Waterman local alignment
 *
 * @param {string} seq1 - First sequence
 * @param {string} seq2 - Second sequence
 * @param {Object} options - Alignment parameters
 * @returns {Object} Alignment result
 */
export async function localAlign(seq1, seq2, options = {}) {
  await initAlignment();

  const {
    matchScore = 2,
    mismatchPenalty = -1,
    gapPenalty = -2,
    affine = false,
    gapOpen = -10,
    gapExtend = -1,
  } = options;

  // Normalize sequences
  const s1 = seq1.toUpperCase().replace(/[^ACGT]/g, '');
  const s2 = seq2.toUpperCase().replace(/[^ACGT]/g, '');

  let result;
  if (affine) {
    result = smith_waterman_affine(s1, s2, matchScore, mismatchPenalty, gapOpen, gapExtend);
  } else {
    result = smith_waterman(s1, s2, matchScore, mismatchPenalty, gapPenalty);
  }

  return {
    score: result.score,
    alignment: {
      seq1: result.aligned_seq1,
      seq2: result.aligned_seq2,
      midline: result.midline,
    },
    positions: {
      start1: result.start_pos1,
      end1: result.end_pos1,
      start2: result.start_pos2,
      end2: result.end_pos2,
    },
    identity: result.identity,
    stats: {
      matches: result.matches,
      mismatches: result.mismatches,
      gaps: result.gaps,
      length: result.aligned_seq1.length,
    },
  };
}

/**
 * Perform Needleman-Wunsch global alignment
 */
export async function globalAlign(seq1, seq2, options = {}) {
  await initAlignment();

  const { matchScore = 1, mismatchPenalty = -1, gapPenalty = -1 } = options;

  const s1 = seq1.toUpperCase().replace(/[^ACGT]/g, '');
  const s2 = seq2.toUpperCase().replace(/[^ACGT]/g, '');

  const result = needleman_wunsch(s1, s2, matchScore, mismatchPenalty, gapPenalty);

  return {
    score: result.score,
    alignment: {
      seq1: result.aligned_seq1,
      seq2: result.aligned_seq2,
      midline: result.midline,
    },
    identity: result.identity,
    stats: {
      matches: result.matches,
      mismatches: result.mismatches,
      gaps: result.gaps,
      length: result.aligned_seq1.length,
    },
  };
}

/**
 * Format alignment for display
 */
export function formatAlignment(result, options = {}) {
  const { lineWidth = 60, showPositions = true } = options;

  const { seq1, seq2, midline } = result.alignment;
  const lines = [];

  for (let i = 0; i < seq1.length; i += lineWidth) {
    const chunk1 = seq1.slice(i, i + lineWidth);
    const chunk2 = seq2.slice(i, i + lineWidth);
    const chunkMid = midline.slice(i, i + lineWidth);

    if (showPositions) {
      const pos = i + 1;
      lines.push(`${String(pos).padStart(6)} ${chunk1}`);
      lines.push(`       ${chunkMid}`);
      lines.push(`${String(pos).padStart(6)} ${chunk2}`);
    } else {
      lines.push(chunk1);
      lines.push(chunkMid);
      lines.push(chunk2);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate random DNA sequence for testing
 */
export function generateRandomSequence(length) {
  const bases = 'ACGT';
  let seq = '';
  for (let i = 0; i < length; i++) {
    seq += bases[Math.floor(Math.random() * 4)];
  }
  return seq;
}

/**
 * Create mutated version of sequence
 */
export function mutateSequence(seq, mutationRate = 0.1) {
  const bases = 'ACGT';
  let mutated = '';

  for (const base of seq) {
    if (Math.random() < mutationRate) {
      // Random mutation
      const r = Math.random();
      if (r < 0.7) {
        // Substitution
        mutated += bases[Math.floor(Math.random() * 4)];
      } else if (r < 0.85) {
        // Insertion
        mutated += base + bases[Math.floor(Math.random() * 4)];
      }
      // else: deletion (don't add the base)
    } else {
      mutated += base;
    }
  }

  return mutated;
}

/**
 * Benchmark alignment performance
 */
export async function benchmarkAlignment(lengths = [100, 500, 1000]) {
  await initAlignment();

  const results = [];

  for (const len of lengths) {
    const seq1 = generateRandomSequence(len);
    const seq2 = mutateSequence(seq1, 0.1);

    // Warm up
    await localAlign(seq1, seq2);

    // Time multiple iterations
    const iterations = Math.max(1, Math.floor(1000 / len));
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      await localAlign(seq1, seq2);
    }

    const elapsed = performance.now() - start;
    const perAlignment = elapsed / iterations;

    results.push({
      length: len,
      iterations,
      totalMs: elapsed.toFixed(2),
      perAlignmentMs: perAlignment.toFixed(2),
      cellsPerSecond: Math.round((len * len) / (perAlignment / 1000)),
    });
  }

  return results;
}
```

## Performance Comparison

Expected speedups:

| Sequence Length | JavaScript | WASM   | Speedup |
| --------------- | ---------- | ------ | ------- |
| 100 bp          | ~5ms       | ~0.2ms | 25x     |
| 500 bp          | ~100ms     | ~4ms   | 25x     |
| 1000 bp         | ~400ms     | ~15ms  | 27x     |
| 5000 bp         | ~10s       | ~350ms | 29x     |

## Key Implementation Details

1. **Matrix Layout**: Row-major order for cache efficiency
2. **Traceback**: Separate direction storage reduces memory access during traceback
3. **Local vs Global**: Smith-Waterman allows zeros (local), Needleman-Wunsch doesn't (global)
4. **Affine Gaps**: Uses 3 matrices (M, X, Y) for realistic gap modeling
