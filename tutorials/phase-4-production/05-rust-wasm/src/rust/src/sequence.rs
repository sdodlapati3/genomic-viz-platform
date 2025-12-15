//! Sequence Operations
//!
//! Fast algorithms for DNA/RNA sequence analysis including
//! k-mer counting, GC content, and basic alignment.

use wasm_bindgen::prelude::*;
use std::collections::HashMap;

/// Calculate GC content of a DNA sequence
/// 
/// # Arguments
/// * `sequence` - DNA sequence string (ACGT)
/// 
/// # Returns
/// GC content as fraction (0.0 - 1.0)
#[wasm_bindgen]
pub fn gc_content(sequence: &str) -> f64 {
    if sequence.is_empty() {
        return 0.0;
    }
    
    let (gc, total) = sequence
        .chars()
        .filter(|c| matches!(c, 'A' | 'C' | 'G' | 'T' | 'a' | 'c' | 'g' | 't'))
        .fold((0, 0), |(gc, total), c| {
            (
                gc + if matches!(c, 'G' | 'C' | 'g' | 'c') { 1 } else { 0 },
                total + 1
            )
        });
    
    if total == 0 {
        0.0
    } else {
        gc as f64 / total as f64
    }
}

/// Calculate GC content in sliding windows
#[wasm_bindgen]
pub fn gc_content_windows(sequence: &str, window_size: usize, step: usize) -> Vec<f64> {
    if sequence.len() < window_size || window_size == 0 || step == 0 {
        return vec![];
    }
    
    let bytes = sequence.as_bytes();
    let mut results = Vec::with_capacity((sequence.len() - window_size) / step + 1);
    
    for start in (0..=bytes.len() - window_size).step_by(step) {
        let window = &sequence[start..start + window_size];
        results.push(gc_content(window));
    }
    
    results
}

/// Count k-mers in a sequence
/// 
/// Returns sorted array of [kmer, count] pairs as a flat string
/// Format: "ACGT:5,CGTA:3,..."
#[wasm_bindgen]
pub fn count_kmers(sequence: &str, k: usize) -> String {
    if sequence.len() < k || k == 0 {
        return String::new();
    }
    
    let seq_upper: String = sequence.to_uppercase();
    let bytes = seq_upper.as_bytes();
    
    let mut counts: HashMap<&[u8], u32> = HashMap::new();
    
    for window in bytes.windows(k) {
        // Skip windows with non-ACGT characters
        if window.iter().all(|&c| matches!(c, b'A' | b'C' | b'G' | b'T')) {
            *counts.entry(window).or_insert(0) += 1;
        }
    }
    
    // Convert to sorted vec and format as string
    let mut sorted: Vec<_> = counts.into_iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(&a.1)); // Sort by count descending
    
    sorted
        .into_iter()
        .map(|(kmer, count)| {
            let kmer_str = String::from_utf8_lossy(kmer);
            format!("{}:{}", kmer_str, count)
        })
        .collect::<Vec<_>>()
        .join(",")
}

/// K-mer result structure for more complex queries
#[wasm_bindgen]
pub struct KmerResult {
    kmers: Vec<String>,
    counts: Vec<u32>,
    total_kmers: u32,
}

#[wasm_bindgen]
impl KmerResult {
    pub fn kmers(&self) -> Vec<String> {
        self.kmers.clone()
    }
    
    pub fn counts(&self) -> Vec<u32> {
        self.counts.clone()
    }
    
    pub fn total(&self) -> u32 {
        self.total_kmers
    }
    
    pub fn unique_count(&self) -> usize {
        self.kmers.len()
    }
}

#[wasm_bindgen]
pub fn count_kmers_detailed(sequence: &str, k: usize) -> KmerResult {
    if sequence.len() < k || k == 0 {
        return KmerResult {
            kmers: vec![],
            counts: vec![],
            total_kmers: 0,
        };
    }
    
    let seq_upper: String = sequence.to_uppercase();
    let bytes = seq_upper.as_bytes();
    
    let mut counts: HashMap<String, u32> = HashMap::new();
    let mut total = 0u32;
    
    for window in bytes.windows(k) {
        if window.iter().all(|&c| matches!(c, b'A' | b'C' | b'G' | b'T')) {
            let kmer = String::from_utf8_lossy(window).to_string();
            *counts.entry(kmer).or_insert(0) += 1;
            total += 1;
        }
    }
    
    let mut sorted: Vec<_> = counts.into_iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(&a.1));
    
    let (kmers, counts): (Vec<_>, Vec<_>) = sorted.into_iter().unzip();
    
    KmerResult {
        kmers,
        counts,
        total_kmers: total,
    }
}

/// Reverse complement of DNA sequence
#[wasm_bindgen]
pub fn reverse_complement(sequence: &str) -> String {
    sequence
        .chars()
        .rev()
        .map(|c| match c {
            'A' => 'T', 'a' => 't',
            'T' => 'A', 't' => 'a',
            'G' => 'C', 'g' => 'c',
            'C' => 'G', 'c' => 'g',
            _ => c,
        })
        .collect()
}

/// Transcribe DNA to RNA
#[wasm_bindgen]
pub fn transcribe(sequence: &str) -> String {
    sequence
        .chars()
        .map(|c| match c {
            'T' => 'U',
            't' => 'u',
            _ => c,
        })
        .collect()
}

/// Translate RNA to protein (single frame)
#[wasm_bindgen]
pub fn translate(sequence: &str) -> String {
    let codon_table = get_codon_table();
    let seq_upper = sequence.to_uppercase();
    let bytes = seq_upper.as_bytes();
    
    bytes
        .chunks(3)
        .filter(|chunk| chunk.len() == 3)
        .map(|codon| {
            let codon_str = String::from_utf8_lossy(codon).to_string();
            *codon_table.get(&codon_str).unwrap_or(&'X')
        })
        .collect()
}

fn get_codon_table() -> HashMap<String, char> {
    let mut table = HashMap::new();
    
    // Standard genetic code
    let codons = [
        ("UUU", 'F'), ("UUC", 'F'), ("UUA", 'L'), ("UUG", 'L'),
        ("UCU", 'S'), ("UCC", 'S'), ("UCA", 'S'), ("UCG", 'S'),
        ("UAU", 'Y'), ("UAC", 'Y'), ("UAA", '*'), ("UAG", '*'),
        ("UGU", 'C'), ("UGC", 'C'), ("UGA", '*'), ("UGG", 'W'),
        ("CUU", 'L'), ("CUC", 'L'), ("CUA", 'L'), ("CUG", 'L'),
        ("CCU", 'P'), ("CCC", 'P'), ("CCA", 'P'), ("CCG", 'P'),
        ("CAU", 'H'), ("CAC", 'H'), ("CAA", 'Q'), ("CAG", 'Q'),
        ("CGU", 'R'), ("CGC", 'R'), ("CGA", 'R'), ("CGG", 'R'),
        ("AUU", 'I'), ("AUC", 'I'), ("AUA", 'I'), ("AUG", 'M'),
        ("ACU", 'T'), ("ACC", 'T'), ("ACA", 'T'), ("ACG", 'T'),
        ("AAU", 'N'), ("AAC", 'N'), ("AAA", 'K'), ("AAG", 'K'),
        ("AGU", 'S'), ("AGC", 'S'), ("AGA", 'R'), ("AGG", 'R'),
        ("GUU", 'V'), ("GUC", 'V'), ("GUA", 'V'), ("GUG", 'V'),
        ("GCU", 'A'), ("GCC", 'A'), ("GCA", 'A'), ("GCG", 'A'),
        ("GAU", 'D'), ("GAC", 'D'), ("GAA", 'E'), ("GAG", 'E'),
        ("GGU", 'G'), ("GGC", 'G'), ("GGA", 'G'), ("GGG", 'G'),
    ];
    
    for (codon, aa) in codons {
        table.insert(codon.to_string(), aa);
    }
    
    table
}

/// Simple Needleman-Wunsch alignment score
/// Returns alignment score (not full traceback)
#[wasm_bindgen]
pub fn alignment_score(seq1: &str, seq2: &str, match_score: i32, mismatch: i32, gap: i32) -> i32 {
    let m = seq1.len();
    let n = seq2.len();
    
    if m == 0 || n == 0 {
        return -(m.max(n) as i32) * gap.abs();
    }
    
    let seq1_bytes = seq1.as_bytes();
    let seq2_bytes = seq2.as_bytes();
    
    // Use only two rows for space efficiency
    let mut prev = vec![0i32; n + 1];
    let mut curr = vec![0i32; n + 1];
    
    // Initialize first row
    for j in 0..=n {
        prev[j] = j as i32 * gap;
    }
    
    // Fill matrix
    for i in 1..=m {
        curr[0] = i as i32 * gap;
        
        for j in 1..=n {
            let match_score = if seq1_bytes[i - 1] == seq2_bytes[j - 1] {
                match_score
            } else {
                mismatch
            };
            
            curr[j] = (prev[j - 1] + match_score)
                .max(prev[j] + gap)
                .max(curr[j - 1] + gap);
        }
        
        std::mem::swap(&mut prev, &mut curr);
    }
    
    prev[n]
}

/// Find all occurrences of pattern in text
#[wasm_bindgen]
pub fn find_pattern(text: &str, pattern: &str) -> Vec<u32> {
    if pattern.is_empty() || text.len() < pattern.len() {
        return vec![];
    }
    
    let text_upper = text.to_uppercase();
    let pattern_upper = pattern.to_uppercase();
    
    text_upper
        .match_indices(&pattern_upper)
        .map(|(idx, _)| idx as u32)
        .collect()
}

/// Hamming distance between two equal-length sequences
#[wasm_bindgen]
pub fn hamming_distance(seq1: &str, seq2: &str) -> u32 {
    if seq1.len() != seq2.len() {
        return u32::MAX;
    }
    
    seq1.chars()
        .zip(seq2.chars())
        .filter(|(a, b)| a.to_ascii_uppercase() != b.to_ascii_uppercase())
        .count() as u32
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_gc_content() {
        assert!((gc_content("GCGC") - 1.0).abs() < 1e-10);
        assert!((gc_content("ATAT") - 0.0).abs() < 1e-10);
        assert!((gc_content("ACGT") - 0.5).abs() < 1e-10);
    }
    
    #[test]
    fn test_reverse_complement() {
        assert_eq!(reverse_complement("ACGT"), "ACGT");
        assert_eq!(reverse_complement("AAAA"), "TTTT");
        assert_eq!(reverse_complement("GCTA"), "TAGC");
    }
    
    #[test]
    fn test_transcribe() {
        assert_eq!(transcribe("ATGC"), "AUGC");
    }
    
    #[test]
    fn test_translate() {
        assert_eq!(translate("AUG"), "M");
        assert_eq!(translate("AUGUAA"), "M*");
    }
    
    #[test]
    fn test_hamming() {
        assert_eq!(hamming_distance("ACGT", "ACGT"), 0);
        assert_eq!(hamming_distance("ACGT", "TGCA"), 4);
        assert_eq!(hamming_distance("ACGT", "ACGA"), 1);
    }
}
