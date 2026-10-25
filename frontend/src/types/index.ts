export * from 'shared';

import type { ProviderId, RegionGroup, WorkloadType } from 'shared';

export const PROVIDERS: { id: ProviderId; label: string; short: string }[] = [
  { id: 'aws', label: 'AWS', short: 'AWS' },
  { id: 'gcp', label: 'Google Cloud', short: 'GCP' },
  { id: 'azure', label: 'Azure', short: 'Azure' },
];

export const REGION_GROUPS: { id: RegionGroup; label: string }[] = [
  { id: 'india', label: 'India (Mumbai / Pune)' },
  { id: 'us_east', label: 'US East (N. Virginia)' },
  { id: 'europe_west', label: 'Western Europe (Ireland / Belgium / Netherlands)' },
  { id: 'southeast_asia', label: 'Southeast Asia (Singapore)' },
];

export const WORKLOAD_TYPES: { id: WorkloadType; label: string }[] = [
  { id: 'web_app', label: 'E-Commerce & Web Applications' },
  { id: 'api', label: 'Microservices & Mobile App Backend APIs' },
  { id: 'data_processing', label: 'Big Data ETL & Media Transcoding' },
  { id: 'machine_learning', label: 'AI Model Inference & Fine-Tuning' },
  { id: 'other', label: 'Databases, Caches & General Workloads' },
];

export interface RealWorldWorkloadDef {
  type: WorkloadType;
  title: string;
  subtitle: string;
  example: string;
  recommendedCores: number;
  recommendedRam: number;
}

export const REAL_WORLD_WORKLOADS: RealWorldWorkloadDef[] = [
  {
    type: 'web_app',
    title: 'E-Commerce & High-Traffic Web App',
    subtitle: 'Online stores, customer storefronts, dynamic product catalogs',
    example: 'Shopify-like store, Next.js frontend, Node.js SSR',
    recommendedCores: 4,
    recommendedRam: 16,
  },
  {
    type: 'api',
    title: 'Microservices & Mobile Backend APIs',
    subtitle: 'High-throughput REST / GraphQL APIs, auth & payments',
    example: 'Express, FastAPI, Golang API gateway with JWT & Redis',
    recommendedCores: 4,
    recommendedRam: 16,
  },
  {
    type: 'data_processing',
    title: 'Big Data ETL & Media Transcoding',
    subtitle: 'Batch log processing, video rendering, Kafka data pipelines',
    example: 'Apache Spark, FFmpeg video encoding, data warehouse ETL',
    recommendedCores: 8,
    recommendedRam: 32,
  },
  {
    type: 'machine_learning',
    title: 'AI Model Inference & LLM Fine-Tuning',
    subtitle: 'CPU-based model evaluation, embeddings, PyTorch inference',
    example: 'Hugging Face transformers, embeddings, batch classification',
    recommendedCores: 8,
    recommendedRam: 32,
  },
  {
    type: 'other',
    title: 'Database Cluster & In-Memory Cache',
    subtitle: 'Transactional databases, search indexers, Redis caching',
    example: 'PostgreSQL, Elasticsearch, Redis Sentinel cluster',
    recommendedCores: 8,
    recommendedRam: 32,
  },
];

export interface RegionalGridTelemetry {
  intensity: number; // gCO2e/kWh
  renewableMix: number; // percentage
  status: 'Clean' | 'Moderate' | 'Carbon-Intensive';
  peakHours: string;
  greenWindow: string;
  gridSource: string;
  optimalAlternativeRegion?: { id: RegionGroup; name: string; savingsPercent: number };
}

export const REGIONAL_GRID_SIGNALS: Record<RegionGroup, RegionalGridTelemetry> = {
  india: {
    intensity: 708,
    renewableMix: 24,
    status: 'Carbon-Intensive',
    peakHours: '6:00 PM – 10:00 PM IST (Coal Grid Load)',
    greenWindow: '11:00 AM – 3:00 PM IST (Solar Peak Window)',
    gridSource: 'Ember Live Grid Signal & CEA National Load Dispatch',
    optimalAlternativeRegion: {
      id: 'europe_west',
      name: 'Western Europe (Belgium/Ireland)',
      savingsPercent: 70.3,
    },
  },
  us_east: {
    intensity: 378,
    renewableMix: 38,
    status: 'Moderate',
    peakHours: '4:00 PM – 8:00 PM EST',
    greenWindow: '12:00 AM – 6:00 AM EST (Off-Peak Hydro/Wind)',
    gridSource: 'EPA eGRID / PJM Interconnection Real-Time Monitor',
    optimalAlternativeRegion: {
      id: 'europe_west',
      name: 'Western Europe (Belgium - 210 g/kWh)',
      savingsPercent: 44.4,
    },
  },
  europe_west: {
    intensity: 210,
    renewableMix: 68,
    status: 'Clean',
    peakHours: '5:00 PM – 8:00 PM CET',
    greenWindow: 'All Day (High Wind & Solar Penetration Active)',
    gridSource: 'Elia / EirGrid / ENTSO-E European Transparency Feed',
  },
  southeast_asia: {
    intensity: 406,
    renewableMix: 8,
    status: 'Moderate',
    peakHours: '1:00 PM – 4:00 PM SGT',
    greenWindow: '11:00 PM – 5:00 AM SGT (Off-Peak Grid)',
    gridSource: 'EMA Singapore Energy Market Authority Live Feed',
    optimalAlternativeRegion: {
      id: 'europe_west',
      name: 'Western Europe (Belgium/Ireland)',
      savingsPercent: 48.3,
    },
  },
};
