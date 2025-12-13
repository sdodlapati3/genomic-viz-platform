//! VCF Data Types
//! 
//! Type definitions for VCF file components

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents a VCF file header
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VcfHeader {
    /// VCF file format version (e.g., "4.2")
    pub file_format: String,
    
    /// Reference genome information
    pub reference: Option<String>,
    
    /// Contig definitions
    pub contigs: Vec<ContigInfo>,
    
    /// INFO field definitions
    pub info_fields: Vec<InfoDefinition>,
    
    /// FORMAT field definitions  
    pub format_fields: Vec<FormatDefinition>,
    
    /// FILTER definitions
    pub filters: Vec<FilterDefinition>,
    
    /// Sample names from header line
    pub samples: Vec<String>,
    
    /// Raw meta-information lines
    pub meta_lines: Vec<String>,
}

impl Default for VcfHeader {
    fn default() -> Self {
        Self {
            file_format: String::from("4.2"),
            reference: None,
            contigs: Vec::new(),
            info_fields: Vec::new(),
            format_fields: Vec::new(),
            filters: Vec::new(),
            samples: Vec::new(),
            meta_lines: Vec::new(),
        }
    }
}

/// Contig (chromosome) information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContigInfo {
    pub id: String,
    pub length: Option<u64>,
}

/// INFO field definition from header
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InfoDefinition {
    pub id: String,
    pub number: String,
    pub field_type: String,
    pub description: String,
}

/// FORMAT field definition from header
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormatDefinition {
    pub id: String,
    pub number: String,
    pub field_type: String,
    pub description: String,
}

/// FILTER definition from header
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterDefinition {
    pub id: String,
    pub description: String,
}

/// Represents a single VCF variant record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VcfRecord {
    /// Chromosome
    pub chrom: String,
    
    /// 1-based position
    pub pos: u64,
    
    /// Variant identifier (e.g., rs number)
    pub id: Option<String>,
    
    /// Reference allele
    pub reference: String,
    
    /// Alternate allele(s)
    pub alternate: Vec<String>,
    
    /// Quality score
    pub qual: Option<f64>,
    
    /// Filter status
    pub filter: FilterStatus,
    
    /// INFO field key-value pairs
    pub info: HashMap<String, InfoValue>,
    
    /// Sample genotypes and data
    pub samples: Vec<SampleData>,
}

impl VcfRecord {
    /// Create a new VCF record with required fields
    pub fn new(chrom: &str, pos: u64, reference: &str, alternate: Vec<&str>) -> Self {
        Self {
            chrom: chrom.to_string(),
            pos,
            id: None,
            reference: reference.to_string(),
            alternate: alternate.into_iter().map(String::from).collect(),
            qual: None,
            filter: FilterStatus::Pass,
            info: HashMap::new(),
            samples: Vec::new(),
        }
    }

    /// Check if variant is a SNP (single nucleotide polymorphism)
    pub fn is_snp(&self) -> bool {
        self.reference.len() == 1 
            && self.alternate.iter().all(|a| a.len() == 1 && a != "*")
    }

    /// Check if variant is an insertion
    pub fn is_insertion(&self) -> bool {
        self.alternate.iter().any(|a| a.len() > self.reference.len())
    }

    /// Check if variant is a deletion
    pub fn is_deletion(&self) -> bool {
        self.alternate.iter().any(|a| a.len() < self.reference.len())
    }

    /// Get variant type classification
    pub fn variant_type(&self) -> VariantType {
        if self.is_snp() {
            VariantType::Snp
        } else if self.is_insertion() && self.is_deletion() {
            VariantType::Complex
        } else if self.is_insertion() {
            VariantType::Insertion
        } else if self.is_deletion() {
            VariantType::Deletion
        } else {
            VariantType::Other
        }
    }
}

/// Filter status for a variant
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FilterStatus {
    Pass,
    Missing,
    Failed(Vec<String>),
}

/// INFO field value types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InfoValue {
    Flag,
    Integer(i64),
    Float(f64),
    String(String),
    IntegerArray(Vec<i64>),
    FloatArray(Vec<f64>),
    StringArray(Vec<String>),
}

/// Sample genotype and format data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SampleData {
    /// Sample name
    pub name: String,
    
    /// Genotype (e.g., "0/1", "1|1")
    pub genotype: Option<Genotype>,
    
    /// Additional format fields
    pub fields: HashMap<String, String>,
}

/// Genotype representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Genotype {
    /// Allele indices (0 = ref, 1+ = alt)
    pub alleles: Vec<Option<u8>>,
    
    /// Is phased (| separator vs / separator)
    pub phased: bool,
}

impl Genotype {
    /// Parse genotype string (e.g., "0/1", "1|1", "./.")
    pub fn parse(s: &str) -> Option<Self> {
        if s == "." || s == "./." || s == ".|." {
            return None;
        }

        let phased = s.contains('|');
        let separator = if phased { '|' } else { '/' };
        
        let alleles: Vec<Option<u8>> = s
            .split(separator)
            .map(|a| {
                if a == "." {
                    None
                } else {
                    a.parse().ok()
                }
            })
            .collect();

        Some(Self { alleles, phased })
    }

    /// Check if genotype is homozygous reference
    pub fn is_hom_ref(&self) -> bool {
        self.alleles.iter().all(|a| *a == Some(0))
    }

    /// Check if genotype is heterozygous
    pub fn is_het(&self) -> bool {
        let non_missing: Vec<_> = self.alleles.iter().filter_map(|a| *a).collect();
        non_missing.len() >= 2 && non_missing.iter().any(|a| *a != non_missing[0])
    }

    /// Check if genotype is homozygous alternate
    pub fn is_hom_alt(&self) -> bool {
        let non_missing: Vec<_> = self.alleles.iter().filter_map(|a| *a).collect();
        !non_missing.is_empty() && non_missing.iter().all(|a| *a > 0 && *a == non_missing[0])
    }
}

/// Variant type classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum VariantType {
    Snp,
    Insertion,
    Deletion,
    Complex,
    Other,
}

/// Statistics for parsed VCF file
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct VcfStats {
    pub total_records: usize,
    pub snps: usize,
    pub insertions: usize,
    pub deletions: usize,
    pub complex: usize,
    pub passed_filter: usize,
    pub failed_filter: usize,
    pub chromosomes: Vec<String>,
}

impl VcfStats {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn update(&mut self, record: &VcfRecord) {
        self.total_records += 1;
        
        match record.variant_type() {
            VariantType::Snp => self.snps += 1,
            VariantType::Insertion => self.insertions += 1,
            VariantType::Deletion => self.deletions += 1,
            VariantType::Complex => self.complex += 1,
            VariantType::Other => {}
        }

        match &record.filter {
            FilterStatus::Pass => self.passed_filter += 1,
            FilterStatus::Failed(_) => self.failed_filter += 1,
            FilterStatus::Missing => {}
        }

        if !self.chromosomes.contains(&record.chrom) {
            self.chromosomes.push(record.chrom.clone());
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_genotype_parse() {
        let gt = Genotype::parse("0/1").unwrap();
        assert_eq!(gt.alleles, vec![Some(0), Some(1)]);
        assert!(!gt.phased);
        assert!(gt.is_het());

        let gt = Genotype::parse("1|1").unwrap();
        assert_eq!(gt.alleles, vec![Some(1), Some(1)]);
        assert!(gt.phased);
        assert!(gt.is_hom_alt());

        let gt = Genotype::parse("0/0").unwrap();
        assert!(gt.is_hom_ref());

        assert!(Genotype::parse("./.").is_none());
    }

    #[test]
    fn test_variant_type() {
        let snp = VcfRecord::new("chr1", 100, "A", vec!["G"]);
        assert_eq!(snp.variant_type(), VariantType::Snp);

        let insertion = VcfRecord::new("chr1", 100, "A", vec!["ATG"]);
        assert_eq!(insertion.variant_type(), VariantType::Insertion);

        let deletion = VcfRecord::new("chr1", 100, "ATG", vec!["A"]);
        assert_eq!(deletion.variant_type(), VariantType::Deletion);
    }
}
