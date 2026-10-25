import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Data Pipeline Validation', () => {
  it('should load and validate compiled dataset snapshot', () => {
    const datasetPath = path.join(__dirname, '../../data/snapshot/dataset.json');
    expect(fs.existsSync(datasetPath)).toBe(true);

    const raw = fs.readFileSync(datasetPath, 'utf-8');
    const dataset = JSON.parse(raw);

    expect(dataset).toHaveProperty('datasetVersion');
    expect(dataset).toHaveProperty('builtAt');
    expect(Array.isArray(dataset.instances)).toBe(true);
    expect(dataset.instances.length).toBeGreaterThan(0);
    expect(Array.isArray(dataset.prices)).toBe(true);
    expect(dataset.prices.length).toBeGreaterThan(0);
  });
});
