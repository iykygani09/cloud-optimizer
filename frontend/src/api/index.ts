import { createAnalysis } from "@/mock/data";
import { historyStore } from "@/mock/history";
import type { AnalysisResult, MetaInfo, Priorities, WorkloadInput } from "@/types";

export interface AnalysisClient {
  analyzeWorkload(input: WorkloadInput, priorities: Priorities): Promise<AnalysisResult>;
  listAnalyses(): Promise<AnalysisResult[]>;
  getAnalysis(id: string): Promise<AnalysisResult | undefined>;
  deleteAnalysis(id: string): Promise<void>;
  getMeta(): Promise<MetaInfo>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getClientId(): string {
  if (typeof window === "undefined") return "browser-client-0000";
  let id = window.localStorage.getItem("cloudwise-client-id");
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `client-${Date.now()}`;
    window.localStorage.setItem("cloudwise-client-id", id);
  }
  return id;
}

export const mockMetaInfo: MetaInfo = {
  datasetVersion: "2026-09-23",
  retrievedAt: new Date().toISOString(),
  regionGroups: [
    { id: "india", label: "India (Mumbai / Pune)" },
    { id: "us_east", label: "US East (N. Virginia)" },
    { id: "europe_west", label: "Western Europe (Ireland / Belgium / Netherlands)" },
    { id: "southeast_asia", label: "Southeast Asia (Singapore)" },
  ],
  workloadTypes: [
    { id: "web_app", label: "Web Application", utilization: 0.4, families: ["general", "compute"] },
    { id: "api", label: "API / Microservices", utilization: 0.4, families: ["general", "compute"] },
    { id: "data_processing", label: "Data Processing / Batch", utilization: 0.7, families: ["general", "compute", "memory"] },
    { id: "machine_learning", label: "Machine Learning (CPU)", utilization: 0.7, families: ["general", "compute", "memory"] },
    { id: "other", label: "Other / General Workload", utilization: 0.5, families: ["general", "compute", "memory"] },
  ],
  assumptions: {
    daysPerMonth: { value: 30, unit: "days", dataType: "estimated", source: "PRD Section 8.1", retrievedAt: "2026-09-23", methodology: "Standard 30-day billing month assumption" },
    pricingModel: { value: 0, unit: "on-demand", dataType: "official", source: "Provider Pricing Pages", retrievedAt: "2026-09-23", methodology: "Public list pricing on-demand, no discounts" },
    carbonMethod: { value: 0, unit: "location-based", dataType: "estimated", source: "Cloud Carbon Footprint Methodology", retrievedAt: "2026-09-23", methodology: "Location-based grid emissions intensity × PUE × hardware power" },
  },
  sources: [
    { id: "aws-pricing", name: "AWS Price List", url: "https://aws.amazon.com/pricing/", type: "official", retrievedAt: "2026-09-23" },
    { id: "azure-retail-prices", name: "Azure Retail Prices API", url: "https://azure.microsoft.com/en-us/pricing/", type: "official", retrievedAt: "2026-09-23" },
    { id: "gcp-billing-catalog", name: "Google Cloud Billing Catalog", url: "https://cloud.google.com/billing/docs/resources/api", type: "official", retrievedAt: "2026-09-23" },
    { id: "ccf-coefficients", name: "Cloud Carbon Footprint Coefficients", url: "https://www.cloudcarbonfootprint.org/docs/coefficients-pipeline", type: "estimated", retrievedAt: "2026-09-23" },
  ],
};

export const mockClient: AnalysisClient = {
  async analyzeWorkload(input, priorities) {
    await wait(400 + Math.random() * 300);
    const analysis = createAnalysis(input, priorities);
    historyStore.save(analysis);
    return analysis;
  },
  async listAnalyses() {
    await wait(100);
    return historyStore.list();
  },
  async getAnalysis(id) {
    await wait(100);
    return historyStore.list().find((item) => item.id === id);
  },
  async deleteAnalysis(id) {
    await wait(100);
    historyStore.remove(id);
  },
  async getMeta() {
    await wait(50);
    return mockMetaInfo;
  },
};

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown[]) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("X-Client-Id", getClientId());

  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    let errBody: { error?: { code?: string; message?: string; details?: unknown[] } } = {};
    try {
      errBody = await response.json();
    } catch {
      // ignore
    }
    const code = errBody.error?.code || "INTERNAL_ERROR";
    const msg = errBody.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(response.status, code, msg, errBody.error?.details);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const httpClient: AnalysisClient = {
  async analyzeWorkload(input, priorities) {
    return request<AnalysisResult>("/analyses", {
      method: "POST",
      body: JSON.stringify({ input, priorities }),
    });
  },
  async listAnalyses() {
    return request<AnalysisResult[]>("/analyses");
  },
  async getAnalysis(id) {
    return request<AnalysisResult>(`/analyses/${id}`);
  },
  async deleteAnalysis(id) {
    return request<void>(`/analyses/${id}`, { method: "DELETE" });
  },
  async getMeta() {
    return request<MetaInfo>("/meta");
  },
};

export const apiClient = import.meta.env.VITE_USE_MOCK === "false" ? httpClient : mockClient;
