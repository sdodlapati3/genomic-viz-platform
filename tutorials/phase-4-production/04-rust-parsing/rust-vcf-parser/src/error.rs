//! VCF Parser Error Types
//! 
//! Custom error types using thiserror for ergonomic error handling

use thiserror::Error;

/// Main error type for VCF parsing operations
#[derive(Error, Debug)]
pub enum VcfError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Invalid VCF format: {0}")]
    InvalidFormat(String),

    #[error("Missing required header")]
    MissingHeader,

    #[error("Invalid header line: {0}")]
    InvalidHeader(String),

    #[error("Invalid record at line {line}: {message}")]
    InvalidRecord { line: usize, message: String },

    #[error("Missing required field '{field}' at line {line}")]
    MissingField { line: usize, field: String },

    #[error("Invalid position '{value}' at line {line}")]
    InvalidPosition { line: usize, value: String },

    #[error("Invalid quality score '{value}' at line {line}")]
    InvalidQuality { line: usize, value: String },

    #[error("Unknown chromosome: {0}")]
    UnknownChromosome(String),

    #[error("Parse error: {0}")]
    Parse(String),

    #[error("UTF-8 encoding error: {0}")]
    Utf8(#[from] std::str::Utf8Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

/// Result type alias for VCF operations
pub type VcfResult<T> = Result<T, VcfError>;

impl VcfError {
    /// Create a new invalid record error
    pub fn invalid_record(line: usize, message: impl Into<String>) -> Self {
        Self::InvalidRecord {
            line,
            message: message.into(),
        }
    }

    /// Create a new missing field error
    pub fn missing_field(line: usize, field: impl Into<String>) -> Self {
        Self::MissingField {
            line,
            field: field.into(),
        }
    }

    /// Create a new invalid position error
    pub fn invalid_position(line: usize, value: impl Into<String>) -> Self {
        Self::InvalidPosition {
            line,
            value: value.into(),
        }
    }

    /// Create a new invalid quality error
    pub fn invalid_quality(line: usize, value: impl Into<String>) -> Self {
        Self::InvalidQuality {
            line,
            value: value.into(),
        }
    }

    /// Check if error is recoverable (can continue parsing)
    pub fn is_recoverable(&self) -> bool {
        matches!(
            self,
            Self::InvalidRecord { .. }
                | Self::InvalidPosition { .. }
                | Self::InvalidQuality { .. }
                | Self::MissingField { .. }
        )
    }
}

/// Warning types for non-fatal parsing issues
#[derive(Debug, Clone)]
pub struct ParseWarning {
    pub line: usize,
    pub message: String,
    pub category: WarningCategory,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WarningCategory {
    MissingInfo,
    UnknownFilter,
    MalformedGenotype,
    DeprecatedFormat,
    Other,
}

impl ParseWarning {
    pub fn new(line: usize, message: impl Into<String>, category: WarningCategory) -> Self {
        Self {
            line,
            message: message.into(),
            category,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let error = VcfError::invalid_record(10, "too few fields");
        assert_eq!(
            error.to_string(),
            "Invalid record at line 10: too few fields"
        );

        let error = VcfError::missing_field(5, "CHROM");
        assert_eq!(
            error.to_string(),
            "Missing required field 'CHROM' at line 5"
        );
    }

    #[test]
    fn test_error_recoverable() {
        assert!(VcfError::invalid_record(1, "test").is_recoverable());
        assert!(VcfError::missing_field(1, "test").is_recoverable());
        assert!(!VcfError::MissingHeader.is_recoverable());
        assert!(!VcfError::InvalidFormat("test".into()).is_recoverable());
    }

    #[test]
    fn test_warning() {
        let warning = ParseWarning::new(15, "Unknown INFO field", WarningCategory::MissingInfo);
        assert_eq!(warning.line, 15);
        assert_eq!(warning.category, WarningCategory::MissingInfo);
    }
}
