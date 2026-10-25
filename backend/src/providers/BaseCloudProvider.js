export class BaseCloudProvider {
    dataset;
    constructor(dataset) {
        this.dataset = dataset;
    }
    async getRegions() {
        const insts = this.dataset.instances.filter((i) => i.provider === this.id);
        const regions = new Set();
        const result = [];
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
    async getServices() {
        const insts = this.dataset.instances.filter((i) => i.provider === this.id);
        const services = Array.from(new Set(insts.map((i) => i.service)));
        return services.map((s) => ({ service: s, kind: 'VM' }));
    }
    async getPricing(region, sku) {
        return this.dataset.prices.filter((p) => p.provider === this.id && p.providerRegion === region && p.sku === sku);
    }
    async getCarbonData(region) {
        const grid = this.dataset.gridIntensity[region] || {
            value: 400,
            unit: 'gCO2e/kWh',
            dataType: 'estimated',
            source: 'Default Global Average',
            retrievedAt: this.dataset.builtAt,
            methodology: 'Global grid average fallback',
        };
        const pue = this.dataset.coefficients.pue[this.id] || {
            value: 1.15,
            unit: 'ratio',
            dataType: 'estimated',
            source: 'Default PUE Fallback',
            retrievedAt: this.dataset.builtAt,
        };
        return { gridIntensity: grid, pue };
    }
}
export class AWSProvider extends BaseCloudProvider {
    id = 'aws';
}
export class GCPProvider extends BaseCloudProvider {
    id = 'gcp';
}
export class AzureProvider extends BaseCloudProvider {
    id = 'azure';
}
