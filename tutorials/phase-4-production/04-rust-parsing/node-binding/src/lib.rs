//! Node.js Bindings for VCF Parser
//!
//! This module provides NAPI bindings for the Rust VCF parser,
//! enabling high-performance VCF parsing from Node.js.

use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::fs;
use vcf_parser::{
    types::{VcfStats as RustVcfStats, VariantType as RustVariantType},
    VcfParser as RustParser,
};

/// VCF Header information exposed to JavaScript
#[napi(object)]
pub struct VcfHeader {
    pub file_format: String,
    pub reference: Option<String>,
    pub sample_count: u32,
    pub samples: Vec<String>,
    pub info_field_count: u32,
    pub format_field_count: u32,
}

/// VCF Record exposed to JavaScript
#[napi(object)]
pub struct VcfRecord {
    pub chrom: String,
    pub pos: u32,
    pub id: Option<String>,
    pub reference: String,
    pub alternate: Vec<String>,
    pub qual: Option<f64>,
    pub filter: String,
    pub variant_type: String,
    pub is_snp: bool,
    pub is_insertion: bool,
    pub is_deletion: bool,
}

/// VCF Statistics exposed to JavaScript
#[napi(object)]
pub struct VcfStats {
    pub total_records: u32,
    pub snps: u32,
    pub insertions: u32,
    pub deletions: u32,
    pub complex: u32,
    pub passed_filter: u32,
    pub failed_filter: u32,
    pub chromosomes: Vec<String>,
}

/// Parse result containing header and records
#[napi(object)]
pub struct ParseResult {
    pub header: VcfHeader,
    pub records: Vec<VcfRecord>,
    pub stats: VcfStats,
    pub parse_time_ms: f64,
}

/// High-performance VCF Parser
#[napi]
pub struct VcfParserNode {
    parse_info: bool,
    parse_samples: bool,
}

#[napi]
impl VcfParserNode {
    /// Create a new VCF parser instance
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            parse_info: true,
            parse_samples: true,
        }
    }

    /// Create a fast parser that skips INFO and sample parsing
    #[napi(factory)]
    pub fn fast() -> Self {
        Self {
            parse_info: false,
            parse_samples: false,
        }
    }

    /// Set whether to parse INFO fields
    #[napi]
    pub fn set_parse_info(&mut self, value: bool) {
        self.parse_info = value;
    }

    /// Set whether to parse sample genotypes
    #[napi]
    pub fn set_parse_samples(&mut self, value: bool) {
        self.parse_samples = value;
    }

    /// Parse VCF file from path
    #[napi]
    pub fn parse_file(&self, path: String) -> Result<ParseResult> {
        let start = std::time::Instant::now();
        
        let content = fs::read_to_string(&path)
            .map_err(|e| Error::from_reason(format!("Failed to read file: {}", e)))?;
        
        self.parse_internal(&content, start)
    }

    /// Parse VCF from string content
    #[napi]
    pub fn parse_string(&self, content: String) -> Result<ParseResult> {
        let start = std::time::Instant::now();
        self.parse_internal(&content, start)
    }

    /// Parse VCF from Buffer
    #[napi]
    pub fn parse_buffer(&self, buffer: Buffer) -> Result<ParseResult> {
        let start = std::time::Instant::now();
        
        let content = std::str::from_utf8(&buffer)
            .map_err(|e| Error::from_reason(format!("Invalid UTF-8: {}", e)))?;
        
        self.parse_internal(content, start)
    }

    /// Internal parsing logic
    fn parse_internal(&self, content: &str, start: std::time::Instant) -> Result<ParseResult> {
        let mut parser = RustParser::new();
        parser.parse_info = self.parse_info;
        parser.parse_samples = self.parse_samples;
        parser.skip_invalid = true;

        let (header, records) = parser.parse_str(content)
            .map_err(|e| Error::from_reason(format!("Parse error: {}", e)))?;

        // Calculate statistics
        let mut stats = RustVcfStats::new();
        for record in &records {
            stats.update(record);
        }

        let parse_time = start.elapsed().as_secs_f64() * 1000.0;

        Ok(ParseResult {
            header: VcfHeader {
                file_format: header.file_format,
                reference: header.reference,
                sample_count: header.samples.len() as u32,
                samples: header.samples,
                info_field_count: header.info_fields.len() as u32,
                format_field_count: header.format_fields.len() as u32,
            },
            records: records
                .into_iter()
                .map(|r| {
                    let variant_type = match r.variant_type() {
                        RustVariantType::Snp => "SNP",
                        RustVariantType::Insertion => "INS",
                        RustVariantType::Deletion => "DEL",
                        RustVariantType::Complex => "COMPLEX",
                        RustVariantType::Other => "OTHER",
                    };
                    
                    let filter = match &r.filter {
                        vcf_parser::types::FilterStatus::Pass => "PASS".to_string(),
                        vcf_parser::types::FilterStatus::Missing => ".".to_string(),
                        vcf_parser::types::FilterStatus::Failed(filters) => filters.join(";"),
                    };

                    VcfRecord {
                        chrom: r.chrom,
                        pos: r.pos as u32,
                        id: r.id,
                        reference: r.reference.clone(),
                        alternate: r.alternate.clone(),
                        qual: r.qual,
                        filter,
                        variant_type: variant_type.to_string(),
                        is_snp: r.is_snp(),
                        is_insertion: r.is_insertion(),
                        is_deletion: r.is_deletion(),
                    }
                })
                .collect(),
            stats: VcfStats {
                total_records: stats.total_records as u32,
                snps: stats.snps as u32,
                insertions: stats.insertions as u32,
                deletions: stats.deletions as u32,
                complex: stats.complex as u32,
                passed_filter: stats.passed_filter as u32,
                failed_filter: stats.failed_filter as u32,
                chromosomes: stats.chromosomes,
            },
            parse_time_ms: parse_time,
        })
    }

    /// Get only statistics without full record parsing (faster for large files)
    #[napi]
    pub fn get_stats(&self, path: String) -> Result<VcfStats> {
        let content = fs::read_to_string(&path)
            .map_err(|e| Error::from_reason(format!("Failed to read file: {}", e)))?;

        // Use fast parser for stats only
        let mut parser = RustParser::fast();
        let (_, records) = parser.parse_str(&content)
            .map_err(|e| Error::from_reason(format!("Parse error: {}", e)))?;

        let stats = vcf_parser::calculate_stats(&records);

        Ok(VcfStats {
            total_records: stats.total_records as u32,
            snps: stats.snps as u32,
            insertions: stats.insertions as u32,
            deletions: stats.deletions as u32,
            complex: stats.complex as u32,
            passed_filter: stats.passed_filter as u32,
            failed_filter: stats.failed_filter as u32,
            chromosomes: stats.chromosomes,
        })
    }
}

/// Parse VCF file (convenience function)
#[napi]
pub fn parse_vcf_file(path: String) -> Result<ParseResult> {
    let parser = VcfParserNode::new();
    parser.parse_file(path)
}

/// Parse VCF string (convenience function)
#[napi]
pub fn parse_vcf_string(content: String) -> Result<ParseResult> {
    let parser = VcfParserNode::new();
    parser.parse_string(content)
}

/// Fast parse for statistics only
#[napi]
pub fn get_vcf_stats(path: String) -> Result<VcfStats> {
    let parser = VcfParserNode::new();
    parser.get_stats(path)
}
