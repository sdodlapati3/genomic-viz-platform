[← Back to Tutorials Index](../../README.md)

---

# Tutorial 4.4: Rust for High-Performance Parsing

Build high-performance VCF (Variant Call Format) file parsers using Rust, with bindings for Node.js (napi-rs) and WebAssembly for the browser.

## Learning Objectives

- **Rust Fundamentals**: Ownership, borrowing, lifetimes, error handling
- **Genomic Data Structures**: VCF file format, variant types, genotypes
- **Node.js Integration**: Native modules with napi-rs
- **WebAssembly**: Browser-based high-performance computing
- **Performance Optimization**: Benchmarking and profiling

## Why Rust for Genomics?

Rust excels at parsing genomic files because:

1. **Memory Safety**: No null pointers, data races, or buffer overflows
2. **Zero-Cost Abstractions**: High-level code compiles to fast machine code
3. **Fearless Concurrency**: Safe parallel processing with rayon
4. **Small Binaries**: Efficient WASM output for browsers
5. **Interoperability**: Easy integration with Node.js and browsers

## Project Structure

```
04-rust-parsing/
├── rust-vcf-parser/          # Core Rust library
│   ├── Cargo.toml            # Rust dependencies
│   └── src/
│       ├── lib.rs            # Library entry point
│       ├── types.rs          # VCF data structures
│       ├── error.rs          # Error handling
│       └── parser.rs         # Parsing logic
│
├── node-binding/             # Node.js native module
│   ├── Cargo.toml
│   ├── build.rs              # napi-rs build config
│   └── src/
│       └── lib.rs            # NAPI bindings
│
├── wasm/                     # WebAssembly module
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs            # WASM bindings
│
├── benchmarks/               # Performance tests
│   ├── package.json
│   ├── js-vcf-parser.js      # JavaScript parser
│   ├── js-parser-benchmark.js
│   ├── benchmark.js          # Comparison benchmark
│   └── generate-test-data.js # Test data generator
│
└── README.md
```

## Prerequisites

### Install Rust

```bash
# Install rustup (Rust toolchain manager)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify installation
rustc --version
cargo --version
```

### Install WASM Tools

```bash
# Install wasm-pack for WebAssembly builds
cargo install wasm-pack

# Install wasm-bindgen CLI (optional)
cargo install wasm-bindgen-cli
```

## Part 1: Core Rust Parser

### VCF Data Types (types.rs)

The VCF format represents genetic variants. Our Rust types model this structure:

```rust
/// Represents a VCF file header
pub struct VcfHeader {
    pub file_format: String,
    pub reference: Option<String>,
    pub samples: Vec<String>,
    pub info_fields: Vec<InfoDefinition>,
    // ...
}

/// Represents a single VCF variant record
pub struct VcfRecord {
    pub chrom: String,           // Chromosome
    pub pos: u64,                // 1-based position
    pub id: Option<String>,      // rs number
    pub reference: String,       // Reference allele
    pub alternate: Vec<String>,  // Alternate alleles
    pub qual: Option<f64>,       // Quality score
    pub filter: FilterStatus,    // PASS/FAIL
    pub info: HashMap<String, InfoValue>,
    pub samples: Vec<SampleData>,
}
```

### Error Handling (error.rs)

Rust uses `Result<T, E>` for error handling. We use `thiserror` for ergonomic custom errors:

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum VcfError {
    #[error("Invalid VCF format: {0}")]
    InvalidFormat(String),

    #[error("Invalid record at line {line}: {message}")]
    InvalidRecord { line: usize, message: String },

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}
```

### Parsing Logic (parser.rs)

The parser uses streaming to handle large files efficiently:

```rust
pub struct VcfParser {
    pub parse_info: bool,      // Parse INFO fields
    pub parse_samples: bool,   // Parse sample genotypes
    pub skip_invalid: bool,    // Skip bad records
}

impl VcfParser {
    /// Parse VCF from any reader (file, network, etc.)
    pub fn parse<R: Read>(&mut self, reader: R)
        -> VcfResult<(VcfHeader, Vec<VcfRecord>)>
    {
        let buf_reader = BufReader::new(reader);
        // ... parsing logic using memchr for fast tab detection
    }
}
```

### Build and Test

```bash
cd rust-vcf-parser

# Build the library
cargo build --release

# Run tests
cargo test

# Check for common issues
cargo clippy

# Format code
cargo fmt
```

## Part 2: Node.js Native Module

### NAPI-RS Bindings (node-binding/src/lib.rs)

```rust
use napi::bindgen_prelude::*;
use napi_derive::napi;

#[napi]
pub struct VcfParserNode {
    parse_info: bool,
    parse_samples: bool,
}

#[napi]
impl VcfParserNode {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self { parse_info: true, parse_samples: true }
    }

    #[napi]
    pub fn parse_file(&self, path: String) -> Result<ParseResult> {
        // Call Rust parser
    }
}
```

### Build Node Module

```bash
cd node-binding

# Build release version
cargo build --release

# The .node file will be in target/release/
```

### Usage in Node.js

```javascript
// Import native module
const { VcfParserNode, parseVcfFile } = require('./vcf-parser-node.node');

// Create parser instance
const parser = new VcfParserNode();

// Parse VCF file
const result = parser.parseFile('./data/variants.vcf');

console.log(`Parsed ${result.records.length} variants in ${result.parseTimeMs}ms`);
console.log(`SNPs: ${result.stats.snps}`);
console.log(`Insertions: ${result.stats.insertions}`);
```

## Part 3: WebAssembly Module

### WASM Bindings (wasm/src/lib.rs)

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmVcfParser {
    parse_info: bool,
    parse_samples: bool,
}

#[wasm_bindgen]
impl WasmVcfParser {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();
        Self { parse_info: true, parse_samples: true }
    }

    #[wasm_bindgen]
    pub fn parse(&self, content: &str) -> Result<JsValue, JsValue> {
        // Parse and return JavaScript object
    }
}
```

### Build WASM Module

```bash
cd wasm

# Build for web browsers
wasm-pack build --target web

# Build for Node.js
wasm-pack build --target nodejs

# The output will be in pkg/
```

### Usage in Browser

```html
<script type="module">
  import init, { WasmVcfParser, parseVcf } from './pkg/vcf_parser_wasm.js';

  async function main() {
    // Initialize WASM
    await init();

    // Create parser
    const parser = new WasmVcfParser();

    // Parse VCF content
    const result = parser.parse(vcfContent);

    console.log(`Parsed ${result.records.length} variants`);
    console.log(`Parse time: ${result.parse_time_ms}ms`);
  }

  main();
</script>
```

## Part 4: Performance Benchmarking

### Generate Test Data

```bash
cd benchmarks

# Generate test VCF files of various sizes
node generate-test-data.js
```

### Run JavaScript Benchmark

```bash
node js-parser-benchmark.js
```

### Run Comparison Benchmark

```bash
# Build WASM first
cd ../wasm && wasm-pack build --target web && cd ../benchmarks

# Run comparison
node benchmark.js
```

### Expected Results

| File Size | Records | JavaScript | Rust (WASM) | Speedup |
| --------- | ------- | ---------- | ----------- | ------- |
| 100 KB    | 1,000   | 15 ms      | 3 ms        | 5x      |
| 1 MB      | 10,000  | 150 ms     | 25 ms       | 6x      |
| 10 MB     | 100,000 | 1.5 s      | 200 ms      | 7.5x    |

## Key Rust Concepts

### Ownership and Borrowing

```rust
fn main() {
    let s1 = String::from("hello");  // s1 owns the string
    let s2 = s1;                      // Ownership moves to s2
    // println!("{}", s1);           // Error! s1 no longer valid
    println!("{}", s2);               // Works
}

fn borrow_example() {
    let s = String::from("hello");
    let len = calculate_length(&s);   // Borrow with &
    println!("{} has length {}", s, len);  // s still valid
}
```

### Pattern Matching

```rust
match record.variant_type() {
    VariantType::Snp => count_snp += 1,
    VariantType::Insertion => count_ins += 1,
    VariantType::Deletion => count_del += 1,
    VariantType::Complex | VariantType::Other => count_other += 1,
}
```

### Result and Option

```rust
// Option for nullable values
let qual: Option<f64> = if value == "." { None } else { Some(value.parse()?) };

// Result for fallible operations
fn parse_position(s: &str) -> Result<u64, VcfError> {
    s.parse().map_err(|_| VcfError::InvalidPosition {
        line: 0,
        value: s.to_string()
    })
}
```

### Iterators and Closures

```rust
// Filter and transform records
let snps: Vec<&VcfRecord> = records
    .iter()
    .filter(|r| r.is_snp())
    .filter(|r| r.filter == FilterStatus::Pass)
    .collect();

// Parallel processing with rayon
use rayon::prelude::*;
let stats: VcfStats = records
    .par_iter()
    .fold(VcfStats::new, |mut s, r| { s.update(r); s })
    .reduce(VcfStats::new, VcfStats::merge);
```

## VCF File Format Reference

### Header Section

```
##fileformat=VCFv4.2
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
#CHROM  POS     ID      REF     ALT     QUAL    FILTER  INFO    FORMAT  SAMPLE1
```

### Data Section

```
chr1    100     rs123   A       G       30      PASS    DP=50   GT:DP   0/1:25
chr1    200     .       AT      A       40      PASS    DP=60   GT:DP   1/1:30
```

### Variant Types

| Type      | Example   | Description              |
| --------- | --------- | ------------------------ |
| SNP       | A → G     | Single nucleotide change |
| Insertion | A → ATG   | Bases added              |
| Deletion  | ATG → A   | Bases removed            |
| Complex   | ATG → GCA | Multiple changes         |

### Genotype Notation

| Genotype | Meaning                 |
| -------- | ----------------------- |
| 0/0      | Homozygous reference    |
| 0/1      | Heterozygous            |
| 1/1      | Homozygous alternate    |
| 1/2      | Heterozygous (two alts) |
| ./.      | Missing                 |
| 0\|1     | Phased heterozygous     |

## Exercises

### Exercise 1: Add Variant Effect Prediction

Extend the parser to predict variant effects:

```rust
pub enum VariantEffect {
    Synonymous,
    Missense,
    Nonsense,
    Frameshift,
    Intronic,
    Unknown,
}

impl VcfRecord {
    pub fn predict_effect(&self, gene_data: &GeneData) -> VariantEffect {
        // Implement effect prediction
    }
}
```

### Exercise 2: Region Filtering

Add efficient region-based filtering:

```rust
impl VcfParser {
    pub fn parse_region(&mut self, reader: R, chrom: &str, start: u64, end: u64)
        -> VcfResult<Vec<VcfRecord>>
    {
        // Only return variants within the region
    }
}
```

### Exercise 3: Parallel Parsing

Use rayon for parallel file parsing:

```rust
pub fn parse_parallel(files: &[PathBuf]) -> Vec<VcfResult<(VcfHeader, Vec<VcfRecord>)>> {
    files.par_iter()
        .map(|f| {
            let mut parser = VcfParser::new();
            parser.parse(File::open(f)?)
        })
        .collect()
}
```

## Production Considerations

### Memory Management

- Use streaming for large files
- Consider memory-mapped files for random access
- Release resources early with explicit drops

### Error Recovery

- Skip invalid records with `skip_invalid` option
- Collect warnings for later review
- Provide line numbers in error messages

### Testing Strategy

- Unit tests for each component
- Integration tests with real VCF files
- Property-based testing with proptest
- Benchmark regressions

## Resources

- [Rust Book](https://doc.rust-lang.org/book/)
- [VCF Specification](https://samtools.github.io/hts-specs/VCFv4.2.pdf)
- [napi-rs Documentation](https://napi.rs/)
- [wasm-bindgen Guide](https://rustwasm.github.io/wasm-bindgen/)
- [Rayon Parallel Crate](https://docs.rs/rayon/)

## Next Steps

After completing this tutorial, you can:

1. Integrate the parser into a full genomics pipeline
2. Add support for BCF (binary VCF) format
3. Implement tabix indexing for random access
4. Build a genome browser with Rust-powered backend
5. Continue to the [Capstone Project](../../../capstone/README.md) to build a complete platform

---

[← Back to Tutorials Index](../../README.md)
