/**
 * Test R Connection
 * Verify R is installed and can execute scripts
 */

import rService from '../services/rService.js';

async function testRConnection() {
  console.log(`
═══════════════════════════════════════════════════════════
  Testing R Connection
═══════════════════════════════════════════════════════════
`);

  // Check R availability
  console.log('1. Checking R availability...');
  const status = await rService.checkRAvailability();
  
  if (status.available) {
    console.log(`   ✓ R is available (version ${status.version})`);
  } else {
    console.log('   ✗ R is NOT available');
    console.log(`
   To install R:
   - macOS: brew install r
   - Ubuntu: sudo apt-get install r-base
   - Windows: Download from https://cran.r-project.org/
   
   The API will use JavaScript fallback for statistical analysis.
`);
    return;
  }

  // Test R script execution
  console.log('\n2. Testing R script execution...');
  try {
    const result = await rService.executeRScript('survival_analysis.R', ['--help']);
    console.log('   ✓ R scripts can execute');
  } catch (error) {
    if (error.message.includes('jsonlite')) {
      console.log('   ⚠ R works but jsonlite package may be missing');
      console.log('   Install with: Rscript -e "install.packages(\'jsonlite\')"');
    } else {
      console.log(`   ✗ Script execution failed: ${error.message}`);
    }
  }

  console.log(`
═══════════════════════════════════════════════════════════
  Test Complete
═══════════════════════════════════════════════════════════
`);
}

testRConnection();
