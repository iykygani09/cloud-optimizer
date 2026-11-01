import type { RegionGroup, RegionalGridTelemetry } from "@/types";
import { REGIONAL_GRID_SIGNALS } from "@/types";

const ELECTRICITY_MAPS_TOKEN = "em_XSEnUSkVjyXTHhdnruFCNYBJv6mHmBfy";

// Zone mapping for Electricity Maps API v3
export const REGION_TO_ZONE: Record<RegionGroup, string> = {
  india: "IN-WE",
  us_east: "US-MIDA-PJM",
  europe_west: "IE",
  southeast_asia: "SG",
};

export interface LiveGridTelemetryResult extends RegionalGridTelemetry {
  isLive: boolean;
  retrievedAt: string;
  sourceType: "live_api" | "baseline";
}

// In-memory / localStorage cache with 10-minute TTL to stay comfortably inside free rate limits
const CACHE_KEY_PREFIX = "cloudwise_live_grid_";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheEntry {
  timestamp: number;
  data: LiveGridTelemetryResult;
}

export async function fetchLiveGridTelemetry(regionGroup: RegionGroup): Promise<LiveGridTelemetryResult> {
  const zone = REGION_TO_ZONE[regionGroup] || "IN-WE";
  const baseline = REGIONAL_GRID_SIGNALS[regionGroup] || REGIONAL_GRID_SIGNALS.india;

  // Check cache first
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const cached = window.localStorage.getItem(`${CACHE_KEY_PREFIX}${zone}`);
      if (cached) {
        const parsed: CacheEntry = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          return parsed.data;
        }
      }
    }
  } catch {
    // Ignore storage parse issues
  }

  try {
    // 1. Fetch live carbon intensity
    const intensityRes = await fetch(`https://api.electricitymap.org/v3/carbon-intensity/latest?zone=${zone}`, {
      headers: { "auth-token": ELECTRICITY_MAPS_TOKEN },
    });

    if (!intensityRes.ok) {
      throw new Error(`HTTP ${intensityRes.status}`);
    }

    const intensityData = await intensityRes.json();
    const liveIntensity = Number(intensityData.carbonIntensity) || baseline.intensity;

    // 2. Fetch live power breakdown for renewable %
    let renewableMix = baseline.renewableMix;
    try {
      const breakdownRes = await fetch(`https://api.electricitymap.org/v3/power-breakdown/latest?zone=${zone}`, {
        headers: { "auth-token": ELECTRICITY_MAPS_TOKEN },
      });
      if (breakdownRes.ok) {
        const breakdownData = await breakdownRes.json();
        if (typeof breakdownData.renewablePercentage === "number") {
          renewableMix = breakdownData.renewablePercentage;
        } else if (typeof breakdownData.fossilFreePercentage === "number") {
          renewableMix = breakdownData.fossilFreePercentage;
        }
      }
    } catch {
      // Non-critical, keep baseline renewableMix
    }

    const status: 'Clean' | 'Moderate' | 'Carbon-Intensive' =
      liveIntensity < 250 ? "Clean" : liveIntensity <= 450 ? "Moderate" : "Carbon-Intensive";

    const result: LiveGridTelemetryResult = {
      ...baseline,
      intensity: liveIntensity,
      renewableMix,
      status,
      gridSource: `Electricity Maps Live Grid API (${zone})`,
      isLive: true,
      retrievedAt: new Date().toISOString(),
      sourceType: "live_api",
    };

    // Save to cache
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const entry: CacheEntry = { timestamp: Date.now(), data: result };
        window.localStorage.setItem(`${CACHE_KEY_PREFIX}${zone}`, JSON.stringify(entry));
      }
    } catch {
      // Ignore storage write issues
    }

    return result;
  } catch (err) {
    console.warn(`Electricity Maps API offline/unreachable for ${zone}, falling back to verified baseline:`, err);
    return {
      ...baseline,
      isLive: false,
      retrievedAt: new Date().toISOString(),
      sourceType: "baseline",
    };
  }
}
