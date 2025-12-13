/**
 * R Service - Execute R scripts from Node.js
 * Uses child_process to spawn R with JSON output
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to R scripts directory
const R_SCRIPTS_DIR = join(__dirname, '..', 'r-scripts');

/**
 * Execute an R script with arguments
 * @param {string} scriptName - Name of R script file
 * @param {string[]} args - Arguments to pass to script
 * @returns {Promise<object>} - Parsed JSON output from R
 */
export async function executeRScript(scriptName, args = []) {
  const scriptPath = join(R_SCRIPTS_DIR, scriptName);
  
  // Verify script exists
  try {
    await fs.access(scriptPath);
  } catch {
    throw new Error(`R script not found: ${scriptPath}`);
  }
  
  return new Promise((resolve, reject) => {
    const rProcess = spawn('Rscript', ['--vanilla', scriptPath, ...args]);
    
    let stdout = '';
    let stderr = '';
    
    rProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    rProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    rProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`R script failed with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        // Parse JSON output from R
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (parseError) {
        // R might output warnings before JSON
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            resolve(JSON.parse(jsonMatch[0]));
          } catch {
            reject(new Error(`Failed to parse R output: ${stdout}`));
          }
        } else {
          reject(new Error(`Invalid JSON from R: ${stdout}`));
        }
      }
    });
    
    rProcess.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error('R is not installed or not in PATH. Please install R.'));
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Check if R is available
 * @returns {Promise<{available: boolean, version: string}>}
 */
export async function checkRAvailability() {
  return new Promise((resolve) => {
    const rProcess = spawn('Rscript', ['--version']);
    
    let output = '';
    
    rProcess.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    rProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    rProcess.on('close', (code) => {
      if (code === 0) {
        const versionMatch = output.match(/R version (\d+\.\d+\.\d+)/i) ||
                            output.match(/R scripting front-end version (\d+\.\d+)/i);
        resolve({
          available: true,
          version: versionMatch ? versionMatch[1] : 'unknown'
        });
      } else {
        resolve({ available: false, version: null });
      }
    });
    
    rProcess.on('error', () => {
      resolve({ available: false, version: null });
    });
  });
}

/**
 * Save data to temporary CSV for R processing
 * @param {object[]} data - Array of data objects
 * @returns {Promise<string>} - Path to temporary file
 */
export async function saveTempCsv(data) {
  const tempDir = os.tmpdir();
  const tempFile = join(tempDir, `r_data_${Date.now()}.csv`);
  
  // Convert to CSV
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h];
      // Quote strings with commas
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return val;
    }).join(',')
  );
  
  const csv = [headers.join(','), ...rows].join('\n');
  await fs.writeFile(tempFile, csv);
  
  return tempFile;
}

/**
 * Clean up temporary file
 * @param {string} filePath - Path to temporary file
 */
export async function cleanupTempFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore cleanup errors
  }
}

// Survival Analysis Functions
export const survivalAnalysis = {
  /**
   * Kaplan-Meier survival analysis
   * @param {string} inputFile - Path to survival data CSV
   */
  async kaplanMeier(inputFile) {
    return executeRScript('survival_analysis.R', ['km', inputFile]);
  },
  
  /**
   * Cox proportional hazards regression
   * @param {string} inputFile - Path to survival data CSV
   */
  async coxRegression(inputFile) {
    return executeRScript('survival_analysis.R', ['cox', inputFile]);
  }
};

// Expression Analysis Functions
export const expressionAnalysis = {
  /**
   * Differential expression analysis
   * @param {string} inputFile - Path to expression data CSV
   */
  async differentialExpression(inputFile) {
    return executeRScript('expression_analysis.R', ['de', inputFile]);
  },
  
  /**
   * Volcano plot data
   * @param {string} inputFile - Path to expression data CSV
   */
  async volcanoData(inputFile) {
    return executeRScript('expression_analysis.R', ['volcano', inputFile]);
  },
  
  /**
   * Gene correlation analysis
   * @param {string} inputFile - Path to expression data CSV
   */
  async geneCorrelation(inputFile) {
    return executeRScript('expression_analysis.R', ['correlation', inputFile]);
  }
};

// Mutation Analysis Functions
export const mutationAnalysis = {
  /**
   * Mutation enrichment by cancer type
   * @param {string} inputFile - Path to mutation frequency CSV
   */
  async enrichment(inputFile) {
    return executeRScript('mutation_analysis.R', ['enrichment', inputFile]);
  },
  
  /**
   * Mutual exclusivity analysis
   * @param {string} inputFile - Path to mutation frequency CSV
   */
  async mutualExclusivity(inputFile) {
    return executeRScript('mutation_analysis.R', ['exclusivity', inputFile]);
  },
  
  /**
   * Cancer clustering by mutation profile
   * @param {string} inputFile - Path to mutation frequency CSV
   */
  async cancerClustering(inputFile) {
    return executeRScript('mutation_analysis.R', ['clustering', inputFile]);
  }
};

export default {
  executeRScript,
  checkRAvailability,
  saveTempCsv,
  cleanupTempFile,
  survivalAnalysis,
  expressionAnalysis,
  mutationAnalysis
};
