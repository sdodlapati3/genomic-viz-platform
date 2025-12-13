//! VCF Parser Library
//! 
//! A high-performance VCF (Variant Call Format) file parser
//! written in Rust for genomic data processing.

pub mod parser;
pub mod types;
pub mod error;

pub use parser::VcfParser;
pub use types::*;
pub use error::VcfError;
