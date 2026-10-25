import fs from 'node:fs';
import path from 'node:path';
import { validateDataLayer } from './validate.js';

const dataDir = path.resolve(process.cwd(), '../data');

export function buildSnapshot() {
  console.log('Running data validation before snapshot build...');
  const report = validateDataLayer();
  if (!report.valid) {
    console.error('Validation failed. Snapshot build aborted.');
    report.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  const instances = JSON.parse(fs.readFileSync(path.join(dataDir, 'catalog/instances.json'), 'utf-8'));
  const prices = JSON.parse(fs.readFileSync(path.join(dataDir, 'catalog/prices.json'), 'utf-8'));
  const sources = JSON.parse(fs.readFileSync(path.join(dataDir, 'sources.json'), 'utf-8'));
  const assumptions = JSON.parse(fs.readFileSync(path.join(dataDir, 'assumptions.json'), 'utf-8'));
  const coefficients = JSON.parse(fs.readFileSync(path.join(dataDir, 'carbon/coefficients.json'), 'utf-8'));
  const gridIntensity = JSON.parse(fs.readFileSync(path.join(dataDir, 'carbon/grid-intensity.json'), 'utf-8'));
  const benchmarks = JSON.parse(fs.readFileSync(path.join(dataDir, 'benchmarks/benchmarks.json'), 'utf-8'));

  const dataset = {
    datasetVersion: '2026-09-23',
    builtAt: new Date().toISOString(),
    instances,
    prices,
    sources,
    assumptions,
    coefficients,
    gridIntensity,
    benchmarks,
  };

  const outputPath = path.join(dataDir, 'snapshot/dataset.json');
  fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2), 'utf-8');

  const stats = fs.statSync(outputPath);
  console.log(`✓ Snapshot built successfully!`);
  console.log(`  - Output: ${outputPath}`);
  console.log(`  - Size: ${(stats.size / 1024).toFixed(2)} KB`);
}

if (process.argv[1]?.includes('build.ts')) {
  buildSnapshot();
}
