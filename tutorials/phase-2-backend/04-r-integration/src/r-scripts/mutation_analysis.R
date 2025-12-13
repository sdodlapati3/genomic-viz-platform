# Mutation Analysis Script
# Statistical analysis of mutation patterns

# Load required libraries
if (!require("stats")) install.packages("stats", repos="http://cran.r-project.org")

# Function: Chi-square test for mutation enrichment
mutation_enrichment <- function(input_file, output_file = NULL) {
  data <- read.csv(input_file)
  
  # Get cancer type columns
  cancer_types <- c("breast", "lung", "colon", "ovarian", "pancreatic", "melanoma")
  
  results <- list()
  
  for (i in 1:nrow(data)) {
    gene <- data$gene[i]
    observed <- as.numeric(data[i, cancer_types])
    total <- data$total_samples[i]
    
    # Calculate expected frequencies (assuming uniform distribution)
    expected <- rep(total / length(cancer_types), length(cancer_types))
    
    # Chi-square test
    chi_result <- chisq.test(observed, p = rep(1/length(cancer_types), length(cancer_types)))
    
    # Find enriched cancer types
    enrichment_ratio <- observed / expected
    enriched <- cancer_types[enrichment_ratio > 1.5]
    depleted <- cancer_types[enrichment_ratio < 0.5]
    
    results[[gene]] <- list(
      gene = gene,
      total_mutations = sum(observed),
      by_cancer_type = setNames(as.list(observed), cancer_types),
      enrichment_ratio = setNames(as.list(round(enrichment_ratio, 2)), cancer_types),
      chi_square = chi_result$statistic,
      pvalue = chi_result$p.value,
      significant = chi_result$p.value < 0.05,
      enriched_in = enriched,
      depleted_in = depleted
    )
  }
  
  result <- list(
    analysis_type = "mutation_enrichment",
    n_genes = nrow(data),
    cancer_types = cancer_types,
    results = results
  )
  
  if (!is.null(output_file)) {
    json_output <- jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE)
    writeLines(json_output, output_file)
  }
  
  return(result)
}

# Function: Mutual exclusivity analysis
mutual_exclusivity <- function(input_file, output_file = NULL) {
  data <- read.csv(input_file)
  
  # Get cancer type columns
  cancer_types <- c("breast", "lung", "colon", "ovarian", "pancreatic", "melanoma")
  
  # Calculate correlation between mutation patterns
  mutation_matrix <- as.matrix(data[, cancer_types])
  rownames(mutation_matrix) <- data$gene
  
  # Normalize by total samples
  mutation_freq <- mutation_matrix / data$total_samples
  
  # Calculate correlation
  cor_matrix <- cor(t(mutation_freq))
  
  # Find mutually exclusive pairs (negative correlation)
  pairs <- list()
  genes <- data$gene
  
  for (i in 1:(length(genes) - 1)) {
    for (j in (i + 1):length(genes)) {
      correlation <- cor_matrix[i, j]
      pairs[[length(pairs) + 1]] <- list(
        gene1 = genes[i],
        gene2 = genes[j],
        correlation = round(correlation, 3),
        relationship = ifelse(correlation < -0.3, "mutually_exclusive",
                             ifelse(correlation > 0.3, "co_occurring", "independent"))
      )
    }
  }
  
  # Sort by absolute correlation
  pairs <- pairs[order(-sapply(pairs, function(x) abs(x$correlation)))]
  
  result <- list(
    analysis_type = "mutual_exclusivity",
    n_genes = nrow(data),
    pairs = pairs[1:20]  # Top 20 pairs
  )
  
  if (!is.null(output_file)) {
    json_output <- jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE)
    writeLines(json_output, output_file)
  }
  
  return(result)
}

# Function: Cancer type clustering by mutation profile
cancer_clustering <- function(input_file, output_file = NULL) {
  data <- read.csv(input_file)
  
  # Get cancer type columns
  cancer_types <- c("breast", "lung", "colon", "ovarian", "pancreatic", "melanoma")
  
  # Create matrix with cancer types as rows
  mutation_matrix <- t(as.matrix(data[, cancer_types]))
  colnames(mutation_matrix) <- data$gene
  
  # Normalize by row (cancer type)
  row_sums <- rowSums(mutation_matrix)
  mutation_freq <- mutation_matrix / row_sums
  
  # Hierarchical clustering
  dist_matrix <- dist(mutation_freq, method = "euclidean")
  hclust_result <- hclust(dist_matrix, method = "ward.D2")
  
  # Get dendrogram order
  order <- hclust_result$order
  
  result <- list(
    analysis_type = "cancer_clustering",
    cancer_types = cancer_types,
    dendrogram_order = cancer_types[order],
    height = hclust_result$height,
    merge = hclust_result$merge
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
  
  if (analysis_type == "enrichment") {
    result <- mutation_enrichment(input_file, output_file)
  } else if (analysis_type == "exclusivity") {
    result <- mutual_exclusivity(input_file, output_file)
  } else if (analysis_type == "clustering") {
    result <- cancer_clustering(input_file, output_file)
  }
  
  if (is.null(output_file)) {
    cat(jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE))
  }
}
