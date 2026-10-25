// MOCK DATA, not real. Local-only history adapter for the demo experience.
import { createAnalysis } from "./data";
import type { AnalysisResult } from "@/types";

const STORAGE_KEY = "cloud-carbon-optimizer-history";
export interface HistoryStore { list(): AnalysisResult[]; save(analysis: AnalysisResult): void; remove(id: string): void; clear(): void; }

const demos: AnalysisResult[] = [
  createAnalysis({ workloadType: "web_app", cpuCores: 4, ramGb: 16, storageGb: 100, runtimeHoursPerDay: 8, dataTransferGbPerDay: 20, requestsPerDay: 0, regionGroup: "india", performanceRequirement: "standard" }, { cost: 50, carbon: 30, performance: 20 }, "demo-web-india"),
  createAnalysis({ workloadType: "api", cpuCores: 8, ramGb: 32, storageGb: 250, runtimeHoursPerDay: 24, dataTransferGbPerDay: 120, requestsPerDay: 8000000, regionGroup: "us_east", performanceRequirement: "high" }, { cost: 30, carbon: 50, performance: 20 }, "demo-api-us"),
  createAnalysis({ workloadType: "data_processing", cpuCores: 16, ramGb: 64, storageGb: 1000, runtimeHoursPerDay: 12, dataTransferGbPerDay: 600, requestsPerDay: 0, regionGroup: "europe_west", performanceRequirement: "high" }, { cost: 20, carbon: 60, performance: 20 }, "demo-data-eu"),
  createAnalysis({ workloadType: "other", cpuCores: 2, ramGb: 8, storageGb: 50, runtimeHoursPerDay: 6, dataTransferGbPerDay: 10, requestsPerDay: 0, regionGroup: "southeast_asia", performanceRequirement: "low" }, { cost: 34, carbon: 33, performance: 33 }, "demo-balanced-sea"),
];

export const historyStore: HistoryStore = {
  list() { try { const value = localStorage.getItem(STORAGE_KEY); return value ? (JSON.parse(value) as AnalysisResult[]) : demos; } catch { return demos; } },
  save(analysis) { const next = [analysis, ...this.list().filter((item) => item.id !== analysis.id)]; localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); },
  remove(id) { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.list().filter((item) => item.id !== id))); },
  clear() { localStorage.setItem(STORAGE_KEY, "[]"); },
};
