import fs from 'node:fs';
import path from 'node:path';
import type { InstanceSpec, PriceRecord, SourcedValue } from 'shared';

const dataDir = path.resolve(process.cwd(), '../data');

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  counts: {
    instances: number;
    prices: number;
    sources: number;
  };
}

export function validateSourcedValue(val: SourcedValue, context: string, errors: string[]) {
  if (!val.source || typeof val.source !== 'string' || val.source.trim() === '') {
    errors.push(`${context}: Missing or empty 'source'`);
  }
  if (!val.retrievedAt || typeof val.retrievedAt !== 'string') {
    errors.push(`${context}: Missing 'retrievedAt' ISO date`);
  }
  if (!['official', 'estimated', 'benchmark'].includes(val.dataType)) {
    errors.push(`${context}: Invalid dataType '${val.dataType}'. Must be official, estimated, or benchmark`);
  }
  if (val.dataType === 'official') {
    if (!val.source.startsWith('http://') && !val.source.startsWith('https://')) {
      errors.push(`${context}: Official record source must be a valid URL starting with http/https. Found '${val.source}'`);
    }
  }
  if (val.dataType === 'estimated' || val.dataType === 'benchmark') {
    if (!val.methodology || typeof val.methodology !== 'string' || val.methodology.trim() === '') {
      errors.push(`${context}: '${val.dataType}' record requires a non-empty 'methodology' description`);
    }
  }
}

export function validateDataLayer(): ValidationReport {
  const errors: string[] = [];

  const instancesPath = path.join(dataDir, 'catalog/instances.json');
  const pricesPath = path.join(dataDir, 'catalog/prices.json');
  const sourcesPath = path.join(dataDir, 'sources.json');
  const coefficientsPath = path.join(dataDir, 'carbon/coefficients.json');
  const gridPath = path.join(dataDir, 'carbon/grid-intensity.json');
  const benchmarksPath = path.join(dataDir, 'benchmarks/benchmarks.json');

  const instances: InstanceSpec[] = JSON.parse(fs.readFileSync(instancesPath, 'utf-8'));
  const prices: PriceRecord[] = JSON.parse(fs.readFileSync(pricesPath, 'utf-8'));
  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
  const coefficients = JSON.parse(fs.readFileSync(coefficientsPath, 'utf-8'));
  const grid = JSON.parse(fs.readFileSync(gridPath, 'utf-8'));
  const benchmarks = JSON.parse(fs.readFileSync(benchmarksPath, 'utf-8'));

  // 1. Validate instances
  instances.forEach((inst, index) => {
    const ctx = `Instance[${index}] ${inst.provider}:${inst.instanceType}`;
    if (!['aws', 'gcp', 'azure'].includes(inst.provider)) {
      errors.push(`${ctx}: Invalid provider '${inst.provider}'`);
    }
    if (!inst.specSource || !inst.specSource.startsWith('http')) {
      errors.push(`${ctx}: specSource must be a valid URL`);
    }
  });

  // 2. Validate prices
  prices.forEach((p, index) => {
    const ctx = `PriceRecord[${index}] ${p.provider}:${p.providerRegion}:${p.sku}`;
    validateSourcedValue(p.price, ctx, errors);
  });

  // 3. Validate carbon coefficients
  Object.entries(coefficients.pue || {}).forEach(([p, val]) => {
    validateSourcedValue(val as SourcedValue, `PUE[${p}]`, errors);
  });
  Object.entries(coefficients.power || {}).forEach(([k, val]) => {
    validateSourcedValue(val as SourcedValue, `PowerCoeff[${k}]`, errors);
  });

  // 4. Validate grid intensity
  Object.entries(grid).forEach(([region, val]) => {
    validateSourcedValue(val as SourcedValue, `GridIntensity[${region}]`, errors);
  });

  // 5. Validate benchmarks
  Object.entries(benchmarks).forEach(([key, val]: [string, any]) => {
    if (!val.cpuFamilyIndex || typeof val.cpuFamilyIndex !== 'number') {
      errors.push(`Benchmark[${key}]: Missing cpuFamilyIndex number`);
    }
    validateSourcedValue(val as SourcedValue, `Benchmark[${key}]`, errors);
  });

  return {
    valid: errors.length === 0,
    errors,
    counts: {
      instances: instances.length,
      prices: prices.length,
      sources: sources.length,
    },
  };
}

if (process.argv[1]?.includes('validate.ts')) {
  console.log('Validating data layer provenance and integrity...');
  const report = validateDataLayer();
  if (!report.valid) {
    console.error('Data layer validation failed with errors:');
    report.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  } else {
    console.log(`✓ Data layer validation PASSED!`);
    console.log(`  - Instances: ${report.counts.instances}`);
    console.log(`  - Prices: ${report.counts.prices}`);
    console.log(`  - Sources: ${report.counts.sources}`);
  }
}
