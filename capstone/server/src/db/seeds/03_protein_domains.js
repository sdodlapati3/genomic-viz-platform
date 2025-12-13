/**
 * Seed: Protein Domains
 * 
 * Populates protein_domains table with domain data for key genes
 */

export async function seed(knex) {
  // Get gene IDs
  const genes = await knex('genes')
    .select('id', 'symbol')
    .whereIn('symbol', ['TP53', 'EGFR', 'BRAF', 'KRAS', 'PIK3CA']);

  if (genes.length === 0) {
    console.log('No genes found, skipping domain seeding...');
    return;
  }

  const geneMap = genes.reduce((acc, g) => {
    acc[g.symbol] = g.id;
    return acc;
  }, {});

  // Check if domains already exist
  const existingDomains = await knex('protein_domains').count('id as count').first();
  if (existingDomains.count > 0) {
    console.log('Protein domains already seeded, skipping...');
    return;
  }

  const domains = [];

  // TP53 domains
  if (geneMap.TP53) {
    domains.push(
      {
        gene_id: geneMap.TP53,
        name: 'TAD1',
        type: 'Transactivation',
        start_position: 1,
        end_position: 40,
        color: '#e74c3c',
        description: 'Transactivation domain 1',
      },
      {
        gene_id: geneMap.TP53,
        name: 'TAD2',
        type: 'Transactivation',
        start_position: 41,
        end_position: 61,
        color: '#e67e22',
        description: 'Transactivation domain 2',
      },
      {
        gene_id: geneMap.TP53,
        name: 'PRD',
        type: 'Proline-rich',
        start_position: 64,
        end_position: 92,
        color: '#f1c40f',
        description: 'Proline-rich domain',
      },
      {
        gene_id: geneMap.TP53,
        name: 'DBD',
        type: 'DNA-binding',
        start_position: 94,
        end_position: 292,
        color: '#3498db',
        description: 'DNA-binding domain - core domain',
      },
      {
        gene_id: geneMap.TP53,
        name: 'TD',
        type: 'Tetramerization',
        start_position: 326,
        end_position: 356,
        color: '#9b59b6',
        description: 'Tetramerization domain',
      },
      {
        gene_id: geneMap.TP53,
        name: 'CTD',
        type: 'Regulatory',
        start_position: 364,
        end_position: 393,
        color: '#1abc9c',
        description: 'C-terminal regulatory domain',
      }
    );
  }

  // EGFR domains
  if (geneMap.EGFR) {
    domains.push(
      {
        gene_id: geneMap.EGFR,
        name: 'L1',
        type: 'Ligand-binding',
        start_position: 1,
        end_position: 165,
        color: '#3498db',
        description: 'Ligand-binding domain L1',
      },
      {
        gene_id: geneMap.EGFR,
        name: 'CR1',
        type: 'Cysteine-rich',
        start_position: 166,
        end_position: 310,
        color: '#e74c3c',
        description: 'Cysteine-rich domain 1',
      },
      {
        gene_id: geneMap.EGFR,
        name: 'L2',
        type: 'Ligand-binding',
        start_position: 311,
        end_position: 480,
        color: '#3498db',
        description: 'Ligand-binding domain L2',
      },
      {
        gene_id: geneMap.EGFR,
        name: 'CR2',
        type: 'Cysteine-rich',
        start_position: 481,
        end_position: 620,
        color: '#e74c3c',
        description: 'Cysteine-rich domain 2',
      },
      {
        gene_id: geneMap.EGFR,
        name: 'TM',
        type: 'Transmembrane',
        start_position: 621,
        end_position: 644,
        color: '#95a5a6',
        description: 'Transmembrane domain',
      },
      {
        gene_id: geneMap.EGFR,
        name: 'Kinase',
        type: 'Kinase',
        start_position: 712,
        end_position: 979,
        color: '#9b59b6',
        description: 'Tyrosine kinase domain',
      }
    );
  }

  // BRAF domains
  if (geneMap.BRAF) {
    domains.push(
      {
        gene_id: geneMap.BRAF,
        name: 'RBD',
        type: 'Ras-binding',
        start_position: 155,
        end_position: 227,
        color: '#e74c3c',
        description: 'Ras-binding domain',
      },
      {
        gene_id: geneMap.BRAF,
        name: 'C1',
        type: 'Cysteine-rich',
        start_position: 234,
        end_position: 280,
        color: '#f1c40f',
        description: 'C1 cysteine-rich domain',
      },
      {
        gene_id: geneMap.BRAF,
        name: 'Kinase',
        type: 'Kinase',
        start_position: 457,
        end_position: 717,
        color: '#3498db',
        description: 'Serine/threonine kinase domain',
      }
    );
  }

  // KRAS domains
  if (geneMap.KRAS) {
    domains.push(
      {
        gene_id: geneMap.KRAS,
        name: 'P-loop',
        type: 'GTP-binding',
        start_position: 10,
        end_position: 17,
        color: '#e74c3c',
        description: 'Phosphate-binding loop',
      },
      {
        gene_id: geneMap.KRAS,
        name: 'Switch I',
        type: 'Switch',
        start_position: 30,
        end_position: 38,
        color: '#3498db',
        description: 'Switch I region',
      },
      {
        gene_id: geneMap.KRAS,
        name: 'Switch II',
        type: 'Switch',
        start_position: 60,
        end_position: 76,
        color: '#3498db',
        description: 'Switch II region',
      },
      {
        gene_id: geneMap.KRAS,
        name: 'G-domain',
        type: 'GTPase',
        start_position: 1,
        end_position: 166,
        color: '#95a5a6',
        description: 'GTPase domain',
      }
    );
  }

  // PIK3CA domains
  if (geneMap.PIK3CA) {
    domains.push(
      {
        gene_id: geneMap.PIK3CA,
        name: 'ABD',
        type: 'Adaptor-binding',
        start_position: 1,
        end_position: 108,
        color: '#e74c3c',
        description: 'Adaptor-binding domain',
      },
      {
        gene_id: geneMap.PIK3CA,
        name: 'RBD',
        type: 'Ras-binding',
        start_position: 190,
        end_position: 291,
        color: '#f1c40f',
        description: 'Ras-binding domain',
      },
      {
        gene_id: geneMap.PIK3CA,
        name: 'C2',
        type: 'C2',
        start_position: 330,
        end_position: 487,
        color: '#3498db',
        description: 'C2 domain',
      },
      {
        gene_id: geneMap.PIK3CA,
        name: 'Helical',
        type: 'Helical',
        start_position: 525,
        end_position: 696,
        color: '#9b59b6',
        description: 'Helical domain',
      },
      {
        gene_id: geneMap.PIK3CA,
        name: 'Kinase',
        type: 'Kinase',
        start_position: 797,
        end_position: 1068,
        color: '#1abc9c',
        description: 'PI3K/PI4K kinase domain',
      }
    );
  }

  if (domains.length > 0) {
    await knex('protein_domains').insert(domains);
    console.log(`Seeded ${domains.length} protein domains`);
  }
}
