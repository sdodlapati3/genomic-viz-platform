/**
 * Tests for JavaScript VCF Parser
 * 
 * Tests the pure JavaScript implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  parseVcf, 
  parseHeader, 
  parseRecord, 
  calculateStats 
} from '../benchmarks/js-vcf-parser.js';

// Sample VCF content for testing
const SAMPLE_VCF = `##fileformat=VCFv4.2
##reference=GRCh38
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
##INFO=<ID=AF,Number=A,Type=Float,Description="Allele Frequency">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
##FORMAT=<ID=DP,Number=1,Type=Integer,Description="Read Depth">
##FILTER=<ID=q10,Description="Quality below 10">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	SAMPLE1	SAMPLE2
chr1	100	rs123	A	G	30	PASS	DP=50;AF=0.25	GT:DP	0/1:25	1/1:30
chr1	200	.	AT	A	40	PASS	DP=60	GT:DP	0/0:28	0/1:32
chr2	300	rs456	C	T,G	50	q10	DP=70	GT:DP	1/2:35	0/1:40
chr2	400	rs789	G	GATC	60	PASS	DP=80	GT:DP	0/1:45	1/1:50
chrX	500	.	AGTC	A	70	PASS	DP=90	GT:DP	0/0:55	0/1:60`;

const HEADER_ONLY = `##fileformat=VCFv4.2
##reference=GRCh38
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO`;

describe('VCF Header Parsing', () => {
  it('should parse file format version', () => {
    const lines = SAMPLE_VCF.split('\n').filter(l => l.startsWith('#'));
    const header = parseHeader(lines);
    
    expect(header.fileFormat).toBe('VCFv4.2');
  });

  it('should parse reference genome', () => {
    const lines = SAMPLE_VCF.split('\n').filter(l => l.startsWith('#'));
    const header = parseHeader(lines);
    
    expect(header.reference).toBe('GRCh38');
  });

  it('should parse INFO field definitions', () => {
    const lines = SAMPLE_VCF.split('\n').filter(l => l.startsWith('#'));
    const header = parseHeader(lines);
    
    expect(header.infoFields).toHaveLength(2);
    expect(header.infoFields[0].ID).toBe('DP');
    expect(header.infoFields[0].Type).toBe('Integer');
  });

  it('should parse FORMAT field definitions', () => {
    const lines = SAMPLE_VCF.split('\n').filter(l => l.startsWith('#'));
    const header = parseHeader(lines);
    
    expect(header.formatFields).toHaveLength(2);
    expect(header.formatFields[0].ID).toBe('GT');
  });

  it('should parse sample names', () => {
    const lines = SAMPLE_VCF.split('\n').filter(l => l.startsWith('#'));
    const header = parseHeader(lines);
    
    expect(header.samples).toEqual(['SAMPLE1', 'SAMPLE2']);
  });

  it('should parse FILTER definitions', () => {
    const lines = SAMPLE_VCF.split('\n').filter(l => l.startsWith('#'));
    const header = parseHeader(lines);
    
    expect(header.filters).toHaveLength(1);
    expect(header.filters[0].ID).toBe('q10');
  });
});

describe('VCF Record Parsing', () => {
  let header;
  
  beforeEach(() => {
    const lines = SAMPLE_VCF.split('\n').filter(l => l.startsWith('#'));
    header = parseHeader(lines);
  });

  it('should parse chromosome', () => {
    const line = 'chr1\t100\trs123\tA\tG\t30\tPASS\tDP=50\tGT\t0/1';
    const record = parseRecord(line, header.samples);
    
    expect(record.chrom).toBe('chr1');
  });

  it('should parse position', () => {
    const line = 'chr1\t12345\t.\tA\tG\t30\tPASS\tDP=50\tGT\t0/1';
    const record = parseRecord(line, header.samples);
    
    expect(record.pos).toBe(12345);
  });

  it('should parse variant ID', () => {
    const line = 'chr1\t100\trs123456\tA\tG\t30\tPASS\tDP=50\tGT\t0/1';
    const record = parseRecord(line, header.samples);
    
    expect(record.id).toBe('rs123456');
  });

  it('should handle missing ID', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\tDP=50\tGT\t0/1';
    const record = parseRecord(line, header.samples);
    
    expect(record.id).toBeNull();
  });

  it('should parse reference and alternate alleles', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\tDP=50\tGT\t0/1';
    const record = parseRecord(line, header.samples);
    
    expect(record.reference).toBe('A');
    expect(record.alternate).toEqual(['G']);
  });

  it('should parse multi-allelic variants', () => {
    const line = 'chr1\t100\t.\tC\tT,G,A\t30\tPASS\tDP=50\tGT\t0/1';
    const record = parseRecord(line, header.samples);
    
    expect(record.alternate).toEqual(['T', 'G', 'A']);
  });

  it('should parse quality score', () => {
    const line = 'chr1\t100\t.\tA\tG\t42.5\tPASS\tDP=50\tGT\t0/1';
    const record = parseRecord(line, header.samples);
    
    expect(record.qual).toBe(42.5);
  });

  it('should handle missing quality', () => {
    const line = 'chr1\t100\t.\tA\tG\t.\tPASS\tDP=50\tGT\t0/1';
    const record = parseRecord(line, header.samples);
    
    expect(record.qual).toBeNull();
  });

  it('should parse PASS filter', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\tDP=50\tGT\t0/1';
    const record = parseRecord(line, header.samples);
    
    expect(record.filter.status).toBe('pass');
  });

  it('should parse failed filters', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tq10;LowQual\tDP=50\tGT\t0/1';
    const record = parseRecord(line, header.samples);
    
    expect(record.filter.status).toBe('failed');
    expect(record.filter.filters).toEqual(['q10', 'LowQual']);
  });
});

describe('INFO Field Parsing', () => {
  it('should parse integer INFO values', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\tDP=50\tGT\t0/1';
    const record = parseRecord(line, []);
    
    expect(record.info.DP).toBe(50);
  });

  it('should parse float INFO values', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\tAF=0.25\tGT\t0/1';
    const record = parseRecord(line, []);
    
    expect(record.info.AF).toBe(0.25);
  });

  it('should parse string INFO values', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\tGENE=TP53\tGT\t0/1';
    const record = parseRecord(line, []);
    
    expect(record.info.GENE).toBe('TP53');
  });

  it('should parse flag INFO values', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\tDB\tGT\t0/1';
    const record = parseRecord(line, []);
    
    expect(record.info.DB).toBe(true);
  });

  it('should parse array INFO values', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\tAC=10,5,3\tGT\t0/1';
    const record = parseRecord(line, []);
    
    expect(record.info.AC).toEqual([10, 5, 3]);
  });

  it('should parse multiple INFO fields', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\tDP=50;AF=0.25;DB\tGT\t0/1';
    const record = parseRecord(line, []);
    
    expect(record.info.DP).toBe(50);
    expect(record.info.AF).toBe(0.25);
    expect(record.info.DB).toBe(true);
  });
});

describe('Sample/Genotype Parsing', () => {
  it('should parse heterozygous genotype', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\t.\tGT\t0/1';
    const record = parseRecord(line, ['SAMPLE1']);
    
    expect(record.samples[0].genotype).toEqual({
      alleles: [0, 1],
      phased: false
    });
  });

  it('should parse homozygous reference genotype', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\t.\tGT\t0/0';
    const record = parseRecord(line, ['SAMPLE1']);
    
    expect(record.samples[0].genotype).toEqual({
      alleles: [0, 0],
      phased: false
    });
  });

  it('should parse homozygous alternate genotype', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\t.\tGT\t1/1';
    const record = parseRecord(line, ['SAMPLE1']);
    
    expect(record.samples[0].genotype).toEqual({
      alleles: [1, 1],
      phased: false
    });
  });

  it('should parse phased genotype', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\t.\tGT\t0|1';
    const record = parseRecord(line, ['SAMPLE1']);
    
    expect(record.samples[0].genotype).toEqual({
      alleles: [0, 1],
      phased: true
    });
  });

  it('should parse missing genotype', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\t.\tGT\t./.';
    const record = parseRecord(line, ['SAMPLE1']);
    
    expect(record.samples[0].genotype).toBeNull();
  });

  it('should parse sample FORMAT fields', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\t.\tGT:DP:GQ\t0/1:25:99';
    const record = parseRecord(line, ['SAMPLE1']);
    
    expect(record.samples[0].fields.DP).toBe('25');
    expect(record.samples[0].fields.GQ).toBe('99');
  });

  it('should parse multiple samples', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\t.\tGT:DP\t0/1:25\t1/1:30\t0/0:20';
    const record = parseRecord(line, ['S1', 'S2', 'S3']);
    
    expect(record.samples).toHaveLength(3);
    expect(record.samples[0].name).toBe('S1');
    expect(record.samples[1].name).toBe('S2');
    expect(record.samples[2].name).toBe('S3');
  });
});

describe('Variant Type Detection', () => {
  it('should detect SNP', () => {
    const line = 'chr1\t100\t.\tA\tG\t30\tPASS\t.\tGT\t0/1';
    const record = parseRecord(line, []);
    
    expect(record.variantType).toBe('SNP');
    expect(record.isSnp).toBe(true);
    expect(record.isInsertion).toBe(false);
    expect(record.isDeletion).toBe(false);
  });

  it('should detect insertion', () => {
    const line = 'chr1\t100\t.\tA\tATGC\t30\tPASS\t.\tGT\t0/1';
    const record = parseRecord(line, []);
    
    expect(record.variantType).toBe('INS');
    expect(record.isSnp).toBe(false);
    expect(record.isInsertion).toBe(true);
    expect(record.isDeletion).toBe(false);
  });

  it('should detect deletion', () => {
    const line = 'chr1\t100\t.\tATGC\tA\t30\tPASS\t.\tGT\t0/1';
    const record = parseRecord(line, []);
    
    expect(record.variantType).toBe('DEL');
    expect(record.isSnp).toBe(false);
    expect(record.isInsertion).toBe(false);
    expect(record.isDeletion).toBe(true);
  });

  it('should detect complex variant (ins+del)', () => {
    // ATG -> A (deletion) and ATG -> ATGCCC (insertion) = COMPLEX
    const line = 'chr1\t100\t.\tATG\tA,ATGCCC\t30\tPASS\t.\tGT\t0/1';
    const record = parseRecord(line, []);
    
    expect(record.variantType).toBe('COMPLEX');
    expect(record.isInsertion).toBe(true);
    expect(record.isDeletion).toBe(true);
  });
});

describe('Full VCF Parsing', () => {
  it('should parse complete VCF file', () => {
    const result = parseVcf(SAMPLE_VCF);
    
    expect(result.header.fileFormat).toBe('VCFv4.2');
    expect(result.records).toHaveLength(5);
  });

  it('should skip invalid records when configured', () => {
    const vcfWithBadRecord = `##fileformat=VCFv4.2
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
chr1	100	.	A	G	30	PASS	.
invalid line
chr1	200	.	C	T	40	PASS	.`;
    
    const result = parseVcf(vcfWithBadRecord, { skipInvalid: true });
    
    expect(result.records).toHaveLength(2);
  });

  it('should throw on invalid records by default', () => {
    const vcfWithBadRecord = `##fileformat=VCFv4.2
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
invalid line`;
    
    expect(() => parseVcf(vcfWithBadRecord)).toThrow();
  });
});

describe('Statistics Calculation', () => {
  it('should count total records', () => {
    const result = parseVcf(SAMPLE_VCF);
    const stats = calculateStats(result.records);
    
    expect(stats.totalRecords).toBe(5);
  });

  it('should count SNPs', () => {
    const result = parseVcf(SAMPLE_VCF);
    const stats = calculateStats(result.records);
    
    expect(stats.snps).toBe(2); // chr1:100 and chr2:300
  });

  it('should count insertions', () => {
    const result = parseVcf(SAMPLE_VCF);
    const stats = calculateStats(result.records);
    
    expect(stats.insertions).toBe(1); // chr2:400
  });

  it('should count deletions', () => {
    const result = parseVcf(SAMPLE_VCF);
    const stats = calculateStats(result.records);
    
    expect(stats.deletions).toBe(2); // chr1:200 and chrX:500
  });

  it('should count passed filters', () => {
    const result = parseVcf(SAMPLE_VCF);
    const stats = calculateStats(result.records);
    
    expect(stats.passedFilter).toBe(4);
  });

  it('should count failed filters', () => {
    const result = parseVcf(SAMPLE_VCF);
    const stats = calculateStats(result.records);
    
    expect(stats.failedFilter).toBe(1); // chr2:300 with q10
  });

  it('should collect unique chromosomes', () => {
    const result = parseVcf(SAMPLE_VCF);
    const stats = calculateStats(result.records);
    
    expect(stats.chromosomes).toContain('chr1');
    expect(stats.chromosomes).toContain('chr2');
    expect(stats.chromosomes).toContain('chrX');
    expect(stats.chromosomes).toHaveLength(3);
  });
});

describe('Edge Cases', () => {
  it('should handle VCF with no samples', () => {
    const result = parseVcf(HEADER_ONLY);
    
    expect(result.header.samples).toHaveLength(0);
  });

  it('should handle empty alternate alleles', () => {
    const vcf = `##fileformat=VCFv4.2
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
chr1	100	.	A	.	30	PASS	.`;
    
    const result = parseVcf(vcf);
    expect(result.records[0].alternate).toEqual([]);
  });

  it('should handle very long indels', () => {
    const longRef = 'A' + 'T'.repeat(1000);
    const vcf = `##fileformat=VCFv4.2
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
chr1	100	.	${longRef}	A	30	PASS	.`;
    
    const result = parseVcf(vcf);
    expect(result.records[0].reference.length).toBe(1001);
    expect(result.records[0].isDeletion).toBe(true);
  });

  it('should handle special characters in INFO description', () => {
    const vcf = `##fileformat=VCFv4.2
##INFO=<ID=DESC,Number=1,Type=String,Description="Contains 'quotes' and =equals">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
chr1	100	.	A	G	30	PASS	DESC=test`;
    
    const result = parseVcf(vcf);
    expect(result.header.infoFields[0].Description).toContain('quotes');
  });
});

describe('Performance Characteristics', () => {
  it('should parse 1000 records efficiently', () => {
    // Generate larger VCF
    const lines = [
      '##fileformat=VCFv4.2',
      '#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tS1'
    ];
    
    for (let i = 0; i < 1000; i++) {
      lines.push(`chr1\t${i * 100}\t.\tA\tG\t30\tPASS\tDP=${i}\tGT\t0/1`);
    }
    
    const vcf = lines.join('\n');
    const start = performance.now();
    const result = parseVcf(vcf);
    const elapsed = performance.now() - start;
    
    expect(result.records).toHaveLength(1000);
    expect(elapsed).toBeLessThan(1000); // Should complete in under 1 second
  });
});
