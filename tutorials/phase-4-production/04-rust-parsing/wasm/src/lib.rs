//! WebAssembly Bindings for VCF Parser
//!
//! This module provides WASM bindings for the Rust VCF parser,
//! enabling high-performance VCF parsing in the browser.

use serde::{Deserialize, Serialize};
use vcf_parser::{
    types::{VcfStats as RustVcfStats, VariantType as RustVariantType},
    VcfParser as RustParser,
};
use wasm_bindgen::prelude::*;

// Initialize panic hook for better error messages
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// VCF Header for JavaScript
#[derive(Serialize, Deserialize)]
#[wasm_bindgen]
pub struct WasmVcfHeader {
    file_format: String,
    reference: Option<String>,
    samples: Vec<String>,
    info_field_count: usize,
    format_field_count: usize,
}

#[wasm_bindgen]
impl WasmVcfHeader {
    #[wasm_bindgen(getter)]
    pub fn file_format(&self) -> String {
        self.file_format.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn reference(&self) -> Option<String> {
        self.reference.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn sample_count(&self) -> usize {
        self.samples.len()
    }

    #[wasm_bindgen(getter)]
    pub fn samples(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.samples).unwrap()
    }
}

/// VCF Record for JavaScript
#[derive(Serialize, Deserialize, Clone)]
pub struct WasmVcfRecord {
    pub chrom: String,
    pub pos: u64,
    pub id: Option<String>,
    pub reference: String,
    pub alternate: Vec<String>,
    pub qual: Option<f64>,
    pub filter: String,
    pub variant_type: String,
    pub is_snp: bool,
}

/// VCF Statistics for JavaScript
#[derive(Serialize, Deserialize)]
#[wasm_bindgen]
pub struct WasmVcfStats {
    total_records: usize,
    snps: usize,
    insertions: usize,
    deletions: usize,
    complex: usize,
    passed_filter: usize,
    failed_filter: usize,
    chromosomes: Vec<String>,
}

#[wasm_bindgen]
impl WasmVcfStats {
    #[wasm_bindgen(getter)]
    pub fn total_records(&self) -> usize {
        self.total_records
    }

    #[wasm_bindgen(getter)]
    pub fn snps(&self) -> usize {
        self.snps
    }

    #[wasm_bindgen(getter)]
    pub fn insertions(&self) -> usize {
        self.insertions
    }

    #[wasm_bindgen(getter)]
    pub fn deletions(&self) -> usize {
        self.deletions
    }

    #[wasm_bindgen(getter)]
    pub fn complex(&self) -> usize {
        self.complex
    }

    #[wasm_bindgen(getter)]
    pub fn passed_filter(&self) -> usize {
        self.passed_filter
    }

    #[wasm_bindgen(getter)]
    pub fn failed_filter(&self) -> usize {
        self.failed_filter
    }

    #[wasm_bindgen(getter)]
    pub fn chromosomes(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.chromosomes).unwrap()
    }

    /// Convert to JSON string
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_default()
    }
}

/// WebAssembly VCF Parser
#[wasm_bindgen]
pub struct WasmVcfParser {
    parse_info: bool,
    parse_samples: bool,
}

#[wasm_bindgen]
impl WasmVcfParser {
    /// Create a new parser
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            parse_info: true,
            parse_samples: true,
        }
    }

    /// Create a fast parser (skips INFO and samples)
    #[wasm_bindgen]
    pub fn fast() -> Self {
        Self {
            parse_info: false,
            parse_samples: false,
        }
    }

    /// Configure INFO field parsing
    #[wasm_bindgen(js_name = setParseInfo)]
    pub fn set_parse_info(&mut self, value: bool) {
        self.parse_info = value;
    }

    /// Configure sample parsing
    #[wasm_bindgen(js_name = setParseSamples)]
    pub fn set_parse_samples(&mut self, value: bool) {
        self.parse_samples = value;
    }

    /// Parse VCF content string
    #[wasm_bindgen]
    pub fn parse(&self, content: &str) -> Result<JsValue, JsValue> {
        let start = get_performance_now();
        
        let mut parser = RustParser::new();
        parser.parse_info = self.parse_info;
        parser.parse_samples = self.parse_samples;
        parser.skip_invalid = true;

        let (header, records) = parser
            .parse_str(content)
            .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

        // Calculate statistics
        let mut stats = RustVcfStats::new();
        for record in &records {
            stats.update(record);
        }

        let parse_time = get_performance_now() - start;

        // Convert records to serializable format
        let js_records: Vec<WasmVcfRecord> = records
            .into_iter()
            .map(|r| {
                let variant_type = match r.variant_type() {
                    RustVariantType::Snp => "SNP",
                    RustVariantType::Insertion => "INS",
                    RustVariantType::Deletion => "DEL",
                    RustVariantType::Complex => "COMPLEX",
                    RustVariantType::Other => "OTHER",
                }
                .to_string();

                let filter = match &r.filter {
                    vcf_parser::types::FilterStatus::Pass => "PASS".to_string(),
                    vcf_parser::types::FilterStatus::Missing => ".".to_string(),
                    vcf_parser::types::FilterStatus::Failed(f) => f.join(";"),
                };

                WasmVcfRecord {
                    chrom: r.chrom,
                    pos: r.pos,
                    id: r.id,
                    reference: r.reference,
                    alternate: r.alternate,
                    qual: r.qual,
                    filter,
                    variant_type,
                    is_snp: r.is_snp(),
                }
            })
            .collect();

        // Create result object
        let result = ParseResultJs {
            header: HeaderJs {
                file_format: header.file_format,
                reference: header.reference,
                samples: header.samples,
                info_field_count: header.info_fields.len(),
                format_field_count: header.format_fields.len(),
            },
            records: js_records,
            stats: StatsJs {
                total_records: stats.total_records,
                snps: stats.snps,
                insertions: stats.insertions,
                deletions: stats.deletions,
                complex: stats.complex,
                passed_filter: stats.passed_filter,
                failed_filter: stats.failed_filter,
                chromosomes: stats.chromosomes,
            },
            parse_time_ms: parse_time,
        };

        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Parse and return only statistics (faster for large files)
    #[wasm_bindgen(js_name = parseStats)]
    pub fn parse_stats(&self, content: &str) -> Result<WasmVcfStats, JsValue> {
        let mut parser = RustParser::fast();

        let (_, records) = parser
            .parse_str(content)
            .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

        let stats = vcf_parser::calculate_stats(&records);

        Ok(WasmVcfStats {
            total_records: stats.total_records,
            snps: stats.snps,
            insertions: stats.insertions,
            deletions: stats.deletions,
            complex: stats.complex,
            passed_filter: stats.passed_filter,
            failed_filter: stats.failed_filter,
            chromosomes: stats.chromosomes,
        })
    }

    /// Get header information only
    #[wasm_bindgen(js_name = parseHeader)]
    pub fn parse_header(&self, content: &str) -> Result<WasmVcfHeader, JsValue> {
        let mut parser = RustParser::new();

        let (header, _) = parser
            .parse_str(content)
            .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

        Ok(WasmVcfHeader {
            file_format: header.file_format,
            reference: header.reference,
            samples: header.samples,
            info_field_count: header.info_fields.len(),
            format_field_count: header.format_fields.len(),
        })
    }

    /// Filter records by chromosome
    #[wasm_bindgen(js_name = filterByChromosome)]
    pub fn filter_by_chromosome(&self, content: &str, chrom: &str) -> Result<JsValue, JsValue> {
        let mut parser = RustParser::new();
        parser.skip_invalid = true;

        let (_, records) = parser
            .parse_str(content)
            .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

        let filtered: Vec<WasmVcfRecord> = records
            .into_iter()
            .filter(|r| r.chrom == chrom)
            .map(|r| WasmVcfRecord {
                chrom: r.chrom,
                pos: r.pos,
                id: r.id,
                reference: r.reference.clone(),
                alternate: r.alternate.clone(),
                qual: r.qual,
                filter: "PASS".to_string(),
                variant_type: format!("{:?}", r.variant_type()),
                is_snp: r.is_snp(),
            })
            .collect();

        serde_wasm_bindgen::to_value(&filtered).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Filter records by position range
    #[wasm_bindgen(js_name = filterByRange)]
    pub fn filter_by_range(
        &self,
        content: &str,
        chrom: &str,
        start: u64,
        end: u64,
    ) -> Result<JsValue, JsValue> {
        let mut parser = RustParser::new();
        parser.skip_invalid = true;

        let (_, records) = parser
            .parse_str(content)
            .map_err(|e| JsValue::from_str(&format!("Parse error: {}", e)))?;

        let filtered: Vec<WasmVcfRecord> = records
            .into_iter()
            .filter(|r| r.chrom == chrom && r.pos >= start && r.pos <= end)
            .map(|r| WasmVcfRecord {
                chrom: r.chrom,
                pos: r.pos,
                id: r.id,
                reference: r.reference.clone(),
                alternate: r.alternate.clone(),
                qual: r.qual,
                filter: "PASS".to_string(),
                variant_type: format!("{:?}", r.variant_type()),
                is_snp: r.is_snp(),
            })
            .collect();

        serde_wasm_bindgen::to_value(&filtered).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

impl Default for WasmVcfParser {
    fn default() -> Self {
        Self::new()
    }
}

// Helper structs for JSON serialization
#[derive(Serialize)]
struct ParseResultJs {
    header: HeaderJs,
    records: Vec<WasmVcfRecord>,
    stats: StatsJs,
    parse_time_ms: f64,
}

#[derive(Serialize)]
struct HeaderJs {
    file_format: String,
    reference: Option<String>,
    samples: Vec<String>,
    info_field_count: usize,
    format_field_count: usize,
}

#[derive(Serialize)]
struct StatsJs {
    total_records: usize,
    snps: usize,
    insertions: usize,
    deletions: usize,
    complex: usize,
    passed_filter: usize,
    failed_filter: usize,
    chromosomes: Vec<String>,
}

/// Get performance.now() from JavaScript
fn get_performance_now() -> f64 {
    web_sys::window()
        .and_then(|w| w.performance())
        .map(|p| p.now())
        .unwrap_or(0.0)
}

/// Convenience function: Parse VCF string
#[wasm_bindgen(js_name = parseVcf)]
pub fn parse_vcf(content: &str) -> Result<JsValue, JsValue> {
    let parser = WasmVcfParser::new();
    parser.parse(content)
}

/// Convenience function: Get VCF stats
#[wasm_bindgen(js_name = getVcfStats)]
pub fn get_vcf_stats(content: &str) -> Result<WasmVcfStats, JsValue> {
    let parser = WasmVcfParser::new();
    parser.parse_stats(content)
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    const SAMPLE_VCF: &str = r#"##fileformat=VCFv4.2
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
chr1	100	rs123	A	G	30	PASS	DP=50
chr1	200	.	AT	A	40	PASS	DP=60
"#;

    #[wasm_bindgen_test]
    fn test_parse() {
        let parser = WasmVcfParser::new();
        let result = parser.parse(SAMPLE_VCF);
        assert!(result.is_ok());
    }

    #[wasm_bindgen_test]
    fn test_parse_stats() {
        let parser = WasmVcfParser::new();
        let stats = parser.parse_stats(SAMPLE_VCF).unwrap();
        assert_eq!(stats.total_records(), 2);
        assert_eq!(stats.snps(), 1);
        assert_eq!(stats.deletions(), 1);
    }

    #[wasm_bindgen_test]
    fn test_parse_header() {
        let parser = WasmVcfParser::new();
        let header = parser.parse_header(SAMPLE_VCF).unwrap();
        assert_eq!(header.file_format(), "VCFv4.2");
    }
}
