import { z } from 'zod';

export const WorkloadTypeSchema = z.enum([
  'web_app',
  'api',
  'data_processing',
  'machine_learning',
  'other',
]);

export const PerformanceRequirementSchema = z.enum([
  'low',
  'standard',
  'high',
  'critical',
]);

export const RegionGroupSchema = z.enum([
  'india',
  'us_east',
  'europe_west',
  'southeast_asia',
]);

export const WorkloadInputSchema = z.object({
  workloadType: WorkloadTypeSchema,
  cpuCores: z.number().int().min(1).max(64),
  ramGb: z.number().int().min(1).max(512),
  storageGb: z.number().int().min(10).max(10000),
  runtimeHoursPerDay: z.number().int().min(1).max(24),
  dataTransferGbPerDay: z.number().min(0).max(10000),
  requestsPerDay: z.number().min(0).max(1000000000),
  regionGroup: RegionGroupSchema,
  performanceRequirement: PerformanceRequirementSchema,
  durationValue: z.number().min(1).max(1000).optional(),
  durationUnit: z.enum(['hours', 'days', 'weeks']).optional(),
  urgency: z.enum(['urgent', 'flexible']).optional(),
});

export const PrioritiesSchema = z
  .object({
    cost: z.number().int().min(0).max(100),
    carbon: z.number().int().min(0).max(100),
    performance: z.number().int().min(0).max(100),
  })
  .refine(
    (data) => {
      // Allow sum = 100 OR allow carbon-locked priorities (e.g., carbon = 100 with any cost & perf)
      return (
        data.cost + data.carbon + data.performance === 100 ||
        data.carbon === 100 ||
        data.cost + data.carbon + data.performance > 0
      );
    },
    { message: 'Priorities must be positive numbers' }
  );

export const CreateAnalysisSchema = z.object({
  input: WorkloadInputSchema,
  priorities: PrioritiesSchema,
});
