# Differential Expression Analysis Script
# Compares gene expression between tumor and normal samples

# Load required libraries
if (!require("stats")) install.packages("stats", repos="http://cran.r-project.org")

# Function: T-test based differential expression
# Simple approach for tutorial purposes
differential_expression <- function(input_file, output_file = NULL) {
  data <- read.csv(input_file)
  
  # Get gene columns (exclude sample_id and condition)
  gene_cols <- setdiff(names(data), c("sample_id", "condition"))
  
  # Separate tumor and normal samples
  tumor <- data[data$condition == "tumor", ]
  normal <- data[data$condition == "normal", ]
  
  results <- data.frame(
    gene = character(),
    tumor_mean = numeric(),
    normal_mean = numeric(),
    log2_fold_change = numeric(),
    pvalue = numeric(),
    adjusted_pvalue = numeric(),
    stringsAsFactors = FALSE
  )
  
  for (gene in gene_cols) {
    tumor_expr <- tumor[[gene]]
    normal_expr <- normal[[gene]]
    
    # Perform t-test
    t_result <- t.test(tumor_expr, normal_expr)
    
    # Calculate fold change (already log2 data)
    tumor_mean <- mean(tumor_expr)
    normal_mean <- mean(normal_expr)
    log2fc <- tumor_mean - normal_mean
    
    results <- rbind(results, data.frame(
      gene = gene,
      tumor_mean = round(tumor_mean, 3),
      normal_mean = round(normal_mean, 3),
      log2_fold_change = round(log2fc, 3),
      pvalue = t_result$p.value,
      adjusted_pvalue = NA  # Will calculate after all tests
    ))
  }
  
  # Adjust p-values for multiple testing (Benjamini-Hochberg)
  results$adjusted_pvalue <- p.adjust(results$pvalue, method = "BH")
  
  # Add significance flags
  results$significant <- results$adjusted_pvalue < 0.05
  results$direction <- ifelse(results$log2_fold_change > 0, "up", "down")
  
  # Sort by adjusted p-value
  results <- results[order(results$adjusted_pvalue), ]
  
  result <- list(
    analysis_type = "differential_expression",
    n_tumor = nrow(tumor),
    n_normal = nrow(normal),
    n_genes = length(gene_cols),
    n_significant = sum(results$significant),
    results = results
  )
  
  if (!is.null(output_file)) {
    json_output <- jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE)
    writeLines(json_output, output_file)
  }
  
  return(result)
}

# Function: Volcano plot data preparation
volcano_data <- function(input_file, output_file = NULL) {
  result <- differential_expression(input_file)
  
  # Add -log10 p-value for volcano plot
  volcano <- result$results
  volcano$neg_log10_pvalue <- -log10(volcano$adjusted_pvalue)
  
  # Classify points for coloring
  volcano$category <- "not_significant"
  volcano$category[volcano$significant & volcano$log2_fold_change > 0.5] <- "up_regulated"
  volcano$category[volcano$significant & volcano$log2_fold_change < -0.5] <- "down_regulated"
  
  result <- list(
    analysis_type = "volcano_data",
    points = volcano,
    thresholds = list(
      pvalue = 0.05,
      log2fc = 0.5
    )
  )
  
  if (!is.null(output_file)) {
    json_output <- jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE)
    writeLines(json_output, output_file)
  }
  
  return(result)
}

# Function: Gene correlation analysis
gene_correlation <- function(input_file, output_file = NULL) {
  data <- read.csv(input_file)
  
  # Get gene columns
  gene_cols <- setdiff(names(data), c("sample_id", "condition"))
  gene_data <- data[, gene_cols]
  
  # Calculate correlation matrix
  cor_matrix <- cor(gene_data, method = "pearson")
  
  # Get significant correlations
  n <- nrow(data)
  t_stat <- cor_matrix * sqrt((n - 2) / (1 - cor_matrix^2))
  p_matrix <- 2 * pt(-abs(t_stat), df = n - 2)
  
  # Extract upper triangle
  correlations <- list()
  for (i in 1:(length(gene_cols) - 1)) {
    for (j in (i + 1):length(gene_cols)) {
      correlations[[length(correlations) + 1]] <- list(
        gene1 = gene_cols[i],
        gene2 = gene_cols[j],
        correlation = round(cor_matrix[i, j], 3),
        pvalue = p_matrix[i, j],
        significant = p_matrix[i, j] < 0.05
      )
    }
  }
  
  result <- list(
    analysis_type = "gene_correlation",
    n_samples = nrow(data),
    n_genes = length(gene_cols),
    correlation_matrix = as.list(as.data.frame(cor_matrix)),
    pairwise_correlations = correlations
  )
  
  if (!is.null(output_file)) {
    json_output <- jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE)
    writeLines(json_output, output_file)
  }
  
  return(result)
}

# Command line interface
args <- commandArgs(trailingOnly = TRUE)
if (length(args) >= 2) {
  analysis_type <- args[1]
  input_file <- args[2]
  output_file <- if (length(args) >= 3) args[3] else NULL
  
  if (analysis_type == "de") {
    result <- differential_expression(input_file, output_file)
  } else if (analysis_type == "volcano") {
    result <- volcano_data(input_file, output_file)
  } else if (analysis_type == "correlation") {
    result <- gene_correlation(input_file, output_file)
  }
  
  if (is.null(output_file)) {
    cat(jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE))
  }
}
