import type { PriceRecord, ProviderId, SourcedValue } from 'shared';
import type { CarbonRegionData, CloudProvider, RegionInfo, ServiceInfo } from './CloudProvider.js';
import type { DatasetSnapshot } from 'shared';

export abstract class BaseCloudProvider implements CloudProvider {
  abstract readonly id: ProviderId;

  constructor(protected dataset: DatasetSnapshot) {}

  async getRegions(): Promise<RegionInfo[]> {
    const insts = this.dataset.instances.filter((i) => i.provider === this.id);
    const regions = new Set<string>();
    const result: RegionInfo[] = [];

    this.dataset.prices
      .filter((p) => p.provider === this.id)
      .forEach((p) => {
        if (!regions.has(p.providerRegion)) {
          regions.add(p.providerRegion);
          result.push({ providerRegion: p.providerRegion, regionLabel: p.providerRegion });
        }
      });
    return result;
  }

  async getServices(): Promise<ServiceInfo[]> {
    const insts = this.dataset.instances.filter((i) => i.provider === this.id);
    const services = Array.from(new Set(insts.map((i) => i.service)));
    return services.map((s) => ({ service: s, kind: 'VM' }));
  }

  async getPricing(region: string, sku: string): Promise<PriceRecord[]> {
    return this.dataset.prices.filter(
      (p) => p.provider === this.id && p.providerRegion === region && p.sku === sku
    );
  }

  async getCarbonData(region: string): Promise<CarbonRegionData> {
    const grid = this.dataset.gridIntensity[region] || {
      value: 400,
      unit: 'gCO2e/kWh',
      dataType: 'estimated' as const,
      source: 'Default Global Average',
      retrievedAt: this.dataset.builtAt,
      methodology: 'Global grid average fallback',
    };
    const pue = this.dataset.coefficients.pue[this.id] || {
      value: 1.15,
      unit: 'ratio',
      dataType: 'estimated' as const,
      source: 'Default PUE Fallback',
      retrievedAt: this.dataset.builtAt,
    };

    return { gridIntensity: grid, pue };
  }
}

export class AWSProvider extends BaseCloudProvider {
  readonly id: ProviderId = 'aws';
}

export class GCPProvider extends BaseCloudProvider {
  readonly id: ProviderId = 'gcp';
}

export class AzureProvider extends BaseCloudProvider {
  readonly id: ProviderId = 'azure';
}
