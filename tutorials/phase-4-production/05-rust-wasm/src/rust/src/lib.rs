//! Genomic WebAssembly Library
//! 
//! High-performance statistical and computational functions
//! for genomic data analysis.

mod fisher;
mod cluster;
mod sequence;
mod matrix;

pub use fisher::*;
pub use cluster::*;
pub use sequence::*;
pub use matrix::*;

use wasm_bindgen::prelude::*;

// Set up panic hook for better error messages in browser
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Get library version
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Simple test function to verify WASM is working
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! WASM is working.", name)
}
