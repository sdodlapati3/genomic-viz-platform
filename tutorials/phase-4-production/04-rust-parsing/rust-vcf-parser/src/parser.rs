//! VCF Parser Implementation
//! 
//! High-performance VCF file parser with streaming support

use crate::error::{ParseWarning, VcfError, VcfResult, WarningCategory};
use crate::types::*;
use memchr::memchr;
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Read};

/// VCF Parser with configurable options
pub struct VcfParser {
    /// Parse INFO fields (can be disabled for speed)
    pub parse_info: bool,
    
    /// Parse sample genotypes
    pub parse_samples: bool,
    
    /// Skip records that fail to parse
    pub skip_invalid: bool,
    
    /// Collect warnings during parsing
    pub collect_warnings: bool,
    
    /// Warnings collected during parsing
    warnings: Vec<ParseWarning>,
    
    /// Current line number for error reporting
    current_line: usize,
}

impl Default for VcfParser {
    fn default() -> Self {
        Self::new()
    }
}

impl VcfParser {
    /// Create a new parser with default settings
    pub fn new() -> Self {
        Self {
            parse_info: true,
            parse_samples: true,
            skip_invalid: false,
            collect_warnings: true,
            warnings: Vec::new(),
            current_line: 0,
        }
    }

    /// Create a fast parser that skips INFO and sample parsing
    pub fn fast() -> Self {
        Self {
            parse_info: false,
            parse_samples: false,
            skip_invalid: true,
            collect_warnings: false,
            warnings: Vec::new(),
            current_line: 0,
        }
    }

    /// Get collected warnings
    pub fn warnings(&self) -> &[ParseWarning] {
        &self.warnings
    }

    /// Clear collected warnings
    pub fn clear_warnings(&mut self) {
        self.warnings.clear();
    }

    /// Parse VCF from a reader
    pub fn parse<R: Read>(&mut self, reader: R) -> VcfResult<(VcfHeader, Vec<VcfRecord>)> {
        let buf_reader = BufReader::new(reader);
        let mut lines = buf_reader.lines();
        
        self.current_line = 0;
        self.warnings.clear();

        // Parse header
        let header = self.parse_header(&mut lines)?;
        
        // Parse records
        let mut records = Vec::new();
        
        for line_result in lines {
            self.current_line += 1;
            let line = line_result?;
            
            if line.is_empty() {
                continue;
            }

            match self.parse_record(&line, &header) {
                Ok(record) => records.push(record),
                Err(e) if self.skip_invalid && e.is_recoverable() => {
                    if self.collect_warnings {
                        self.warnings.push(ParseWarning::new(
                            self.current_line,
                            e.to_string(),
                            WarningCategory::Other,
                        ));
                    }
                }
                Err(e) => return Err(e),
            }
        }

        Ok((header, records))
    }

    /// Parse VCF from a string
    pub fn parse_str(&mut self, content: &str) -> VcfResult<(VcfHeader, Vec<VcfRecord>)> {
        self.parse(content.as_bytes())
    }

    /// Parse header section
    fn parse_header<B: BufRead>(
        &mut self,
        lines: &mut std::io::Lines<B>,
    ) -> VcfResult<VcfHeader> {
        let mut header = VcfHeader::default();
        let mut found_header_line = false;

        for line_result in lines {
            self.current_line += 1;
            let line = line_result?;

            if line.starts_with("##") {
                // Meta-information line
                header.meta_lines.push(line.clone());
                self.parse_meta_line(&line, &mut header)?;
            } else if line.starts_with("#CHROM") {
                // Header line with column names
                found_header_line = true;
                self.parse_header_line(&line, &mut header)?;
                break;
            } else if !line.is_empty() {
                // Data line before header - error
                return Err(VcfError::MissingHeader);
            }
        }

        if !found_header_line {
            return Err(VcfError::MissingHeader);
        }

        Ok(header)
    }

    /// Parse a meta-information line (##key=value)
    fn parse_meta_line(&mut self, line: &str, header: &mut VcfHeader) -> VcfResult<()> {
        let content = &line[2..]; // Skip ##
        
        if let Some(eq_pos) = content.find('=') {
            let key = &content[..eq_pos];
            let value = &content[eq_pos + 1..];

            match key {
                "fileformat" => {
                    header.file_format = value.to_string();
                }
                "reference" => {
                    header.reference = Some(value.to_string());
                }
                "contig" => {
                    if let Some(contig) = self.parse_structured_field(value) {
                        header.contigs.push(ContigInfo {
                            id: contig.get("ID").cloned().unwrap_or_default(),
                            length: contig.get("length").and_then(|l| l.parse().ok()),
                        });
                    }
                }
                "INFO" => {
                    if let Some(info) = self.parse_structured_field(value) {
                        header.info_fields.push(InfoDefinition {
                            id: info.get("ID").cloned().unwrap_or_default(),
                            number: info.get("Number").cloned().unwrap_or_default(),
                            field_type: info.get("Type").cloned().unwrap_or_default(),
                            description: info.get("Description").cloned().unwrap_or_default(),
                        });
                    }
                }
                "FORMAT" => {
                    if let Some(fmt) = self.parse_structured_field(value) {
                        header.format_fields.push(FormatDefinition {
                            id: fmt.get("ID").cloned().unwrap_or_default(),
                            number: fmt.get("Number").cloned().unwrap_or_default(),
                            field_type: fmt.get("Type").cloned().unwrap_or_default(),
                            description: fmt.get("Description").cloned().unwrap_or_default(),
                        });
                    }
                }
                "FILTER" => {
                    if let Some(filter) = self.parse_structured_field(value) {
                        header.filters.push(FilterDefinition {
                            id: filter.get("ID").cloned().unwrap_or_default(),
                            description: filter.get("Description").cloned().unwrap_or_default(),
                        });
                    }
                }
                _ => {}
            }
        }

        Ok(())
    }

    /// Parse structured field like <ID=XX,Number=1,Type=Integer,Description="...">
    fn parse_structured_field(&self, value: &str) -> Option<HashMap<String, String>> {
        if !value.starts_with('<') || !value.ends_with('>') {
            return None;
        }

        let inner = &value[1..value.len() - 1];
        let mut fields = HashMap::new();
        let mut current_key = String::new();
        let mut current_value = String::new();
        let mut in_quotes = false;
        let mut in_value = false;

        for ch in inner.chars() {
            match ch {
                '"' => {
                    in_quotes = !in_quotes;
                }
                '=' if !in_quotes => {
                    in_value = true;
                }
                ',' if !in_quotes => {
                    if !current_key.is_empty() {
                        fields.insert(current_key.clone(), current_value.clone());
                    }
                    current_key.clear();
                    current_value.clear();
                    in_value = false;
                }
                _ => {
                    if in_value {
                        current_value.push(ch);
                    } else {
                        current_key.push(ch);
                    }
                }
            }
        }

        // Don't forget the last field
        if !current_key.is_empty() {
            fields.insert(current_key, current_value);
        }

        Some(fields)
    }

    /// Parse the header line (#CHROM POS ID REF ALT QUAL FILTER INFO FORMAT sample1 ...)
    fn parse_header_line(&mut self, line: &str, header: &mut VcfHeader) -> VcfResult<()> {
        let fields: Vec<&str> = line.split('\t').collect();
        
        if fields.len() < 8 {
            return Err(VcfError::InvalidHeader(
                "Header line must have at least 8 columns".into(),
            ));
        }

        // Extract sample names (columns after FORMAT)
        if fields.len() > 9 {
            header.samples = fields[9..].iter().map(|s| s.to_string()).collect();
        }

        Ok(())
    }

    /// Parse a single VCF record line
    fn parse_record(&self, line: &str, header: &VcfHeader) -> VcfResult<VcfRecord> {
        // Use memchr for fast tab finding
        let bytes = line.as_bytes();
        let mut fields = Vec::with_capacity(10);
        let mut start = 0;

        while let Some(pos) = memchr(b'\t', &bytes[start..]) {
            fields.push(&line[start..start + pos]);
            start = start + pos + 1;
        }
        fields.push(&line[start..]);

        if fields.len() < 8 {
            return Err(VcfError::invalid_record(
                self.current_line,
                format!("Expected at least 8 fields, found {}", fields.len()),
            ));
        }

        // Parse required fields
        let chrom = fields[0].to_string();
        
        let pos: u64 = fields[1]
            .parse()
            .map_err(|_| VcfError::invalid_position(self.current_line, fields[1]))?;

        let id = if fields[2] == "." {
            None
        } else {
            Some(fields[2].to_string())
        };

        let reference = fields[3].to_string();
        
        let alternate: Vec<String> = if fields[4] == "." {
            Vec::new()
        } else {
            fields[4].split(',').map(String::from).collect()
        };

        let qual = if fields[5] == "." {
            None
        } else {
            fields[5]
                .parse()
                .map_err(|_| VcfError::invalid_quality(self.current_line, fields[5]))
                .ok()
        };

        let filter = self.parse_filter(fields[6]);

        // Parse INFO field
        let info = if self.parse_info {
            self.parse_info_field(fields[7])
        } else {
            HashMap::new()
        };

        // Parse samples
        let samples = if self.parse_samples && fields.len() > 9 {
            self.parse_samples(&fields[8..], &header.samples)
        } else {
            Vec::new()
        };

        Ok(VcfRecord {
            chrom,
            pos,
            id,
            reference,
            alternate,
            qual,
            filter,
            info,
            samples,
        })
    }

    /// Parse FILTER field
    fn parse_filter(&self, value: &str) -> FilterStatus {
        match value {
            "." => FilterStatus::Missing,
            "PASS" => FilterStatus::Pass,
            _ => FilterStatus::Failed(value.split(';').map(String::from).collect()),
        }
    }

    /// Parse INFO field
    fn parse_info_field(&self, value: &str) -> HashMap<String, InfoValue> {
        let mut info = HashMap::new();

        if value == "." {
            return info;
        }

        for item in value.split(';') {
            if let Some(eq_pos) = item.find('=') {
                let key = &item[..eq_pos];
                let val = &item[eq_pos + 1..];
                info.insert(key.to_string(), self.parse_info_value(val));
            } else {
                // Flag field (no value)
                info.insert(item.to_string(), InfoValue::Flag);
            }
        }

        info
    }

    /// Parse INFO field value, trying to determine type
    fn parse_info_value(&self, value: &str) -> InfoValue {
        // Check for array (contains comma)
        if value.contains(',') {
            let parts: Vec<&str> = value.split(',').collect();
            
            // Try integer array
            if let Some(ints) = parts
                .iter()
                .map(|p| p.parse::<i64>().ok())
                .collect::<Option<Vec<_>>>()
            {
                return InfoValue::IntegerArray(ints);
            }
            
            // Try float array
            if let Some(floats) = parts
                .iter()
                .map(|p| p.parse::<f64>().ok())
                .collect::<Option<Vec<_>>>()
            {
                return InfoValue::FloatArray(floats);
            }
            
            // String array
            return InfoValue::StringArray(parts.iter().map(|s| s.to_string()).collect());
        }

        // Single value
        if let Ok(i) = value.parse::<i64>() {
            return InfoValue::Integer(i);
        }
        if let Ok(f) = value.parse::<f64>() {
            return InfoValue::Float(f);
        }

        InfoValue::String(value.to_string())
    }

    /// Parse sample columns
    fn parse_samples(&self, fields: &[&str], sample_names: &[String]) -> Vec<SampleData> {
        if fields.is_empty() {
            return Vec::new();
        }

        let format_keys: Vec<&str> = fields[0].split(':').collect();
        let mut samples = Vec::with_capacity(fields.len() - 1);

        for (i, sample_field) in fields[1..].iter().enumerate() {
            let name = sample_names
                .get(i)
                .cloned()
                .unwrap_or_else(|| format!("SAMPLE_{}", i));

            let values: Vec<&str> = sample_field.split(':').collect();
            let mut sample_data = SampleData {
                name,
                genotype: None,
                fields: HashMap::new(),
            };

            for (j, key) in format_keys.iter().enumerate() {
                if let Some(value) = values.get(j) {
                    if *key == "GT" {
                        sample_data.genotype = Genotype::parse(value);
                    } else {
                        sample_data.fields.insert(key.to_string(), value.to_string());
                    }
                }
            }

            samples.push(sample_data);
        }

        samples
    }
}

/// Iterator-based parser for streaming large files
pub struct VcfIterator<R: Read> {
    reader: std::io::Lines<BufReader<R>>,
    parser: VcfParser,
    header: VcfHeader,
    current_line: usize,
}

impl<R: Read> VcfIterator<R> {
    /// Create a new streaming VCF iterator
    pub fn new(reader: R) -> VcfResult<Self> {
        let buf_reader = BufReader::new(reader);
        let mut lines = buf_reader.lines();
        let mut parser = VcfParser::new();
        
        // Parse header first
        let header = parser.parse_header(&mut lines)?;
        let current_line = parser.current_line;

        Ok(Self {
            reader: lines,
            parser,
            header,
            current_line,
        })
    }

    /// Get the parsed header
    pub fn header(&self) -> &VcfHeader {
        &self.header
    }
}

impl<R: Read> Iterator for VcfIterator<R> {
    type Item = VcfResult<VcfRecord>;

    fn next(&mut self) -> Option<Self::Item> {
        loop {
            match self.reader.next() {
                Some(Ok(line)) => {
                    self.current_line += 1;
                    
                    if line.is_empty() {
                        continue;
                    }

                    return Some(self.parser.parse_record(&line, &self.header));
                }
                Some(Err(e)) => return Some(Err(VcfError::Io(e))),
                None => return None,
            }
        }
    }
}

/// Calculate statistics from VCF records in parallel
#[cfg(feature = "parallel")]
pub fn calculate_stats_parallel(records: &[VcfRecord]) -> VcfStats {
    use rayon::prelude::*;

    records
        .par_iter()
        .fold(VcfStats::new, |mut stats, record| {
            stats.update(record);
            stats
        })
        .reduce(VcfStats::new, |mut a, b| {
            a.total_records += b.total_records;
            a.snps += b.snps;
            a.insertions += b.insertions;
            a.deletions += b.deletions;
            a.complex += b.complex;
            a.passed_filter += b.passed_filter;
            a.failed_filter += b.failed_filter;
            for chrom in b.chromosomes {
                if !a.chromosomes.contains(&chrom) {
                    a.chromosomes.push(chrom);
                }
            }
            a
        })
}

/// Calculate statistics from VCF records
pub fn calculate_stats(records: &[VcfRecord]) -> VcfStats {
    let mut stats = VcfStats::new();
    for record in records {
        stats.update(record);
    }
    stats
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_VCF: &str = r#"##fileformat=VCFv4.2
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
##FORMAT=<ID=DP,Number=1,Type=Integer,Description="Read Depth">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	SAMPLE1	SAMPLE2
chr1	100	rs123	A	G	30	PASS	DP=50	GT:DP	0/1:25	1/1:30
chr1	200	.	AT	A	40	PASS	DP=60	GT:DP	0/0:28	0/1:32
chr2	300	rs456	C	T,G	50	q10	DP=70	GT:DP	1/2:35	0/1:40
"#;

    #[test]
    fn test_parse_vcf() {
        let mut parser = VcfParser::new();
        let (header, records) = parser.parse_str(SAMPLE_VCF).unwrap();

        assert_eq!(header.file_format, "VCFv4.2");
        assert_eq!(header.samples, vec!["SAMPLE1", "SAMPLE2"]);
        assert_eq!(records.len(), 3);
    }

    #[test]
    fn test_parse_record() {
        let mut parser = VcfParser::new();
        let (_, records) = parser.parse_str(SAMPLE_VCF).unwrap();

        let record = &records[0];
        assert_eq!(record.chrom, "chr1");
        assert_eq!(record.pos, 100);
        assert_eq!(record.id, Some("rs123".to_string()));
        assert_eq!(record.reference, "A");
        assert_eq!(record.alternate, vec!["G"]);
        assert_eq!(record.qual, Some(30.0));
        assert_eq!(record.filter, FilterStatus::Pass);
        assert!(record.is_snp());
    }

    #[test]
    fn test_parse_samples() {
        let mut parser = VcfParser::new();
        let (_, records) = parser.parse_str(SAMPLE_VCF).unwrap();

        let record = &records[0];
        assert_eq!(record.samples.len(), 2);
        
        let sample1 = &record.samples[0];
        assert_eq!(sample1.name, "SAMPLE1");
        assert!(sample1.genotype.as_ref().unwrap().is_het());
        
        let sample2 = &record.samples[1];
        assert!(sample2.genotype.as_ref().unwrap().is_hom_alt());
    }

    #[test]
    fn test_parse_info() {
        let mut parser = VcfParser::new();
        let (_, records) = parser.parse_str(SAMPLE_VCF).unwrap();

        let info = &records[0].info;
        match info.get("DP") {
            Some(InfoValue::Integer(dp)) => assert_eq!(*dp, 50),
            _ => panic!("Expected integer DP"),
        }
    }

    #[test]
    fn test_variant_types() {
        let mut parser = VcfParser::new();
        let (_, records) = parser.parse_str(SAMPLE_VCF).unwrap();

        assert_eq!(records[0].variant_type(), VariantType::Snp);
        assert_eq!(records[1].variant_type(), VariantType::Deletion);
        assert_eq!(records[2].variant_type(), VariantType::Snp);
    }

    #[test]
    fn test_stats() {
        let mut parser = VcfParser::new();
        let (_, records) = parser.parse_str(SAMPLE_VCF).unwrap();
        let stats = calculate_stats(&records);

        assert_eq!(stats.total_records, 3);
        assert_eq!(stats.snps, 2);
        assert_eq!(stats.deletions, 1);
        assert_eq!(stats.passed_filter, 2);
        assert_eq!(stats.failed_filter, 1);
    }

    #[test]
    fn test_fast_parser() {
        let mut parser = VcfParser::fast();
        let (_, records) = parser.parse_str(SAMPLE_VCF).unwrap();

        assert_eq!(records.len(), 3);
        // Fast parser doesn't parse INFO or samples
        assert!(records[0].info.is_empty());
        assert!(records[0].samples.is_empty());
    }

    #[test]
    fn test_iterator() {
        let iter = VcfIterator::new(SAMPLE_VCF.as_bytes()).unwrap();
        
        assert_eq!(iter.header().samples.len(), 2);
        
        let records: Vec<_> = iter.filter_map(|r| r.ok()).collect();
        assert_eq!(records.len(), 3);
    }
}
