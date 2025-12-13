# Survival Analysis Script for Genomic Data
# Performs Kaplan-Meier analysis and Cox proportional hazards

# Load required libraries
if (!require("survival")) install.packages("survival", repos="http://cran.r-project.org")
if (!require("survminer")) install.packages("survminer", repos="http://cran.r-project.org")

library(survival)
library(survminer)

# Function: Kaplan-Meier survival analysis
# Input: CSV with survival_months, event, mutation_status columns
# Output: JSON with survival curves and statistics
kaplan_meier_analysis <- function(input_file, output_file = NULL) {
  # Read data
  data <- read.csv(input_file)
  
  # Create survival object
  surv_obj <- Surv(time = data$survival_months, event = data$event)
  
  # Fit Kaplan-Meier model by mutation status
  km_fit <- survfit(surv_obj ~ mutation_status, data = data)
  
  # Get survival summary
  summary_km <- summary(km_fit)
  
  # Extract survival curves for each group
  groups <- levels(factor(data$mutation_status))
  curves <- list()
  
  for (group in groups) {
    group_fit <- survfit(surv_obj ~ 1, data = data[data$mutation_status == group, ])
    group_summary <- summary(group_fit)
    
    curves[[group]] <- data.frame(
      time = group_summary$time,
      survival = group_summary$surv,
      lower = group_summary$lower,
      upper = group_summary$upper,
      n_risk = group_summary$n.risk,
      n_event = group_summary$n.event
    )
  }
  
  # Log-rank test
  logrank <- survdiff(surv_obj ~ mutation_status, data = data)
  pvalue <- 1 - pchisq(logrank$chisq, length(logrank$n) - 1)
  
  # Median survival times
  median_survival <- list()
  for (group in groups) {
    group_fit <- survfit(surv_obj ~ 1, data = data[data$mutation_status == group, ])
    median_survival[[group]] <- median(group_fit)
  }
  
  # Build result object
  result <- list(
    analysis_type = "kaplan_meier",
    n_samples = nrow(data),
    groups = groups,
    curves = curves,
    logrank_pvalue = pvalue,
    median_survival = median_survival,
    significant = pvalue < 0.05
  )
  
  # Output as JSON
  if (!is.null(output_file)) {
    json_output <- jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE)
    writeLines(json_output, output_file)
  }
  
  return(result)
}

# Function: Cox proportional hazards regression
# Analyzes effect of mutation status controlling for covariates
cox_regression <- function(input_file, covariates = c("age", "stage"), output_file = NULL) {
  data <- read.csv(input_file)
  
  # Convert stage to numeric if present
  if ("stage" %in% names(data)) {
    stage_map <- c("I" = 1, "II" = 2, "III" = 3, "IV" = 4)
    data$stage_numeric <- stage_map[data$stage]
  }
  
  # Create formula
  formula_str <- "Surv(survival_months, event) ~ mutation_status"
  if ("age" %in% covariates && "age" %in% names(data)) {
    formula_str <- paste(formula_str, "+ age")
  }
  if ("stage" %in% covariates && "stage_numeric" %in% names(data)) {
    formula_str <- paste(formula_str, "+ stage_numeric")
  }
  if ("gender" %in% covariates && "gender" %in% names(data)) {
    formula_str <- paste(formula_str, "+ gender")
  }
  
  # Fit Cox model
  cox_fit <- coxph(as.formula(formula_str), data = data)
  cox_summary <- summary(cox_fit)
  
  # Extract hazard ratios
  hr <- exp(coef(cox_fit))
  hr_ci <- exp(confint(cox_fit))
  
  result <- list(
    analysis_type = "cox_regression",
    n_samples = nrow(data),
    formula = formula_str,
    hazard_ratios = as.list(hr),
    confidence_intervals = list(
      lower = as.list(hr_ci[, 1]),
      upper = as.list(hr_ci[, 2])
    ),
    pvalues = as.list(cox_summary$coefficients[, 5]),
    concordance = cox_summary$concordance[1],
    likelihood_ratio_test = list(
      statistic = cox_summary$logtest[1],
      pvalue = cox_summary$logtest[3]
    )
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
  
  if (analysis_type == "km") {
    result <- kaplan_meier_analysis(input_file, output_file)
  } else if (analysis_type == "cox") {
    result <- cox_regression(input_file, output_file = output_file)
  }
  
  if (is.null(output_file)) {
    cat(jsonlite::toJSON(result, auto_unbox = TRUE, pretty = TRUE))
  }
}
