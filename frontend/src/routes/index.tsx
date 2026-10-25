import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Check, Clock, Cloud, Database, ExternalLink, Leaf, Radio, SearchCheck, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api";
import type { AnalysisResult, CandidateConfig } from "@/types";
import { formatWorkload, providerLabelMap } from "@/components/app-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Real-Time Carbon Footprint Estimator for Cloud Workloads" },
      { name: "description", content: "Predict real-time carbon emissions, schedule green energy windows, and optimize cloud costs across AWS, Google Cloud, and Azure." },
      { property: "og:title", content: "Real-Time Carbon Footprint Estimator for Cloud Workloads" },
      { property: "og:description", content: "Predict real-time carbon emissions, schedule green energy windows, and optimize cloud costs across AWS, Google Cloud, and Azure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

const sampleViews = {
  "Urgent Execution": { x: 25, y: 64, provider: "Google Cloud", cost: "$150", carbon: "50 kg", note: "Immediate launch option" },
  "Carbon-First": { x: 57, y: 28, provider: "Azure (Europe)", cost: "$177", carbon: "19 kg", note: "Cleanest regional grid window" },
  "Balanced Fit": { x: 38, y: 48, provider: "AWS (Graviton)", cost: "$135", carbon: "32 kg", note: "Optimal carbon & cost balance" },
};
type ViewName = "Urgent Execution" | "Carbon-First" | "Balanced Fit";

function getCandidateCost(c?: CandidateConfig): number {
  if (!c) return 0;
  return c.monthlyCostUsd?.value ?? (c as any).cost?.value ?? 0;
}
function getCandidateCarbon(c?: CandidateConfig): number {
  if (!c) return 0;
  return c.monthlyCo2eKg?.value ?? (c as any).carbon?.value ?? 0;
}

function Overview() {
  const [view, setView] = useState<ViewName>("Carbon-First");
  const [recentAnalysis, setRecentAnalysis] = useState<any | null>(null);

  useEffect(() => {
    // 1. Immediately retrieve from localStorage for zero-latency instant rendering
    try {
      const cached = localStorage.getItem("cloudwise_recent_analysis");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.id || parsed.input || parsed.recommendations)) {
          setRecentAnalysis(parsed);
        }
      }
    } catch {
      // ignore
    }

    // 2. Fetch latest analysis from API (retrieves previous runs from DynamoDB)
    apiClient.listAnalyses()
      .then(async (list) => {
        if (list && list.length > 0 && list[0]) {
          const first = list[0];
          if ((first as any).candidates && (first as any).candidates.length > 0) {
            setRecentAnalysis(first);
            try {
              localStorage.setItem("cloudwise_recent_analysis", JSON.stringify(first));
            } catch {}
          } else {
            // Show summary immediately while fetching full candidate specs
            setRecentAnalysis((prev: any) => prev || first);
            try {
              const full = await apiClient.getAnalysis(first.id);
              if (full) {
                setRecentAnalysis(full);
                try {
                  localStorage.setItem("cloudwise_recent_analysis", JSON.stringify(full));
                } catch {}
              }
            } catch {
              setRecentAnalysis(first);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="surface-grid overflow-hidden">
      <section className="mx-auto max-w-[1440px] px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success elevation-1">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex size-2 rounded-full bg-success"></span>
              </span>
              Live Real-Time Grid Carbon Feed Active
            </div>

            <h1 className="mt-6 max-w-2xl text-[2.4rem] font-bold leading-[1.08] display-heading sm:text-5xl lg:text-6xl text-foreground">
              Real-Time Carbon Footprint Estimator for Cloud Workloads
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
              Predict exact carbon emissions (kg CO₂e) and costs for your required duration across <strong>AWS, Google Cloud, and Azure</strong>. Know whether to run urgently or time-shift to green energy windows.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto gap-2 font-semibold">
                <Link to="/configure">
                  <Sparkles className="size-4" />
                  Estimate Workload Carbon
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link to="/history">
                  View Analysis History
                </Link>
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="size-3.5 text-primary" />
                Real-time regional grid emission factors
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-3.5 text-primary" />
                Hourly, daily & weekly timeframe estimates
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-3.5 text-primary" />
                1-click direct cloud console deployment
              </span>
            </div>
          </div>

          <ScatterPanel view={view} onView={setView} recentAnalysis={recentAnalysis} />
        </div>
      </section>

      <Benefits />
      <HowItWorks />

      <section className="border-t bg-card">
        <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-10 sm:px-6 md:grid-cols-[auto_1fr_auto] md:items-center lg:px-8">
          <span className="grid size-12 place-items-center rounded-lg bg-secondary text-primary">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">100% Transparent Data Provenance</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Every carbon and price calculation cites its official source, retrieved date, and location-based calculation methodology. Direct redirect links connect you straight to official cloud consoles.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/configure">Start new estimate</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function ScatterPanel({
  view,
  onView,
  recentAnalysis,
}: {
  view: ViewName;
  onView: (view: ViewName) => void;
  recentAnalysis: any | null;
}) {
  const tabs: ViewName[] = ["Urgent Execution", "Carbon-First", "Balanced Fit"];

  // If no recent analysis at all, fall back to interactive preview
  if (!recentAnalysis || (!recentAnalysis.candidates && !recentAnalysis.recommendations && !recentAnalysis.input)) {
    const selected = sampleViews[view];
    return (
      <div className="rounded-xl border bg-card p-4 elevation-3 sm:p-6">
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interactive Preview</p>
            </div>
            <p className="mt-1 font-semibold text-sm">E-Commerce & High-Traffic Web Store · 4 vCPU · 16 GB</p>
          </div>
          <div className="grid grid-cols-3 rounded-md border p-1 text-xs">
            {tabs.map((item) => (
              <button
                key={item}
                onClick={() => onView(item)}
                className={`min-h-9 rounded px-2.5 text-[11px] font-semibold transition-colors ${
                  view === item ? "bg-secondary text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={view === item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-5 h-72 rounded-lg border bg-muted/30" role="img" aria-label={`Cost versus carbon scatter. ${selected.provider} is highlighted for ${view}.`}>
          <span className="absolute left-3 top-3 text-[10px] text-muted-foreground font-medium">🌿 Lower carbon footprint</span>
          <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground font-medium">Higher cost</span>
          <div className="absolute inset-x-8 bottom-9 top-8 border-b border-l">
            <div className="absolute left-1/2 top-0 h-full border-l border-dashed border-border" />
            <div className="absolute left-0 top-1/2 w-full border-t border-dashed border-border" />
            {[
              { x: 24, y: 67, label: "AWS", color: "bg-provider-aws" },
              { x: 38, y: 48, label: "GCP", color: "bg-provider-gcp" },
              { x: 58, y: 28, label: "Azure", color: "bg-provider-azure" },
            ].map((point) => (
              <span
                key={point.label}
                className={`absolute grid size-9 -translate-x-1/2 translate-y-1/2 place-items-center rounded-full text-[9px] font-bold text-primary-foreground ${point.color}`}
                style={{ left: `${point.x}%`, bottom: `${point.y}%` }}
              >
                {point.label}
              </span>
            ))}
            <span
              className="absolute size-14 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-primary bg-primary/15 transition-[left,bottom] duration-300"
              style={{ left: `${selected.x}%`, bottom: `${selected.y}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm">{selected.provider}</p>
            <p className="truncate text-xs text-muted-foreground">{selected.note}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Estimated spend</p>
            <p className="metric text-sm font-semibold">{selected.cost}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Carbon emissions</p>
            <p className="metric text-sm font-semibold text-success">{selected.carbon}</p>
          </div>
        </div>
      </div>
    );
  }

  // Workload and candidates extraction
  const input = recentAnalysis.input || {};
  const rawCandidates: CandidateConfig[] = (recentAnalysis.candidates && recentAnalysis.candidates.length > 0)
    ? recentAnalysis.candidates
    : [];

  const extractRec = (rec: any, defaultProv: "aws" | "gcp" | "azure", fallbackName: string, defaultCost: number, defaultCo2: number): CandidateConfig => {
    if (typeof rec === "string") {
      const found = rawCandidates.find((c) => c.id === rec);
      if (found) return found;
    } else if (rec && typeof rec === "object") {
      const found = rawCandidates.find((c) => c.id === rec.candidateId);
      if (found) return found;
      return {
        id: rec.candidateId || `rec-${defaultProv}`,
        provider: rec.provider || defaultProv,
        configName: rec.configName || fallbackName,
        service: (rec.provider || defaultProv) === "aws" ? "EC2" : (rec.provider || defaultProv) === "gcp" ? "Compute Engine" : "Virtual Machines",
        providerRegion: "auto",
        regionLabel: "Selected Region",
        vcpu: input.cpuCores || 4,
        ramGb: input.ramGb || 16,
        storageGb: input.storageGb || 100,
        runtimeHoursPerDay: input.runtimeHoursPerDay || 8,
        monthlyCostUsd: { value: Number(rec.monthlyCostUsd || defaultCost), unit: "USD", dataType: "estimated", source: "Catalog", retrievedAt: "" },
        monthlyCo2eKg: { value: Number(rec.monthlyCo2eKg || defaultCo2), unit: "kg", dataType: "estimated", source: "Catalog", retrievedAt: "" },
        performanceScore: { value: 75, unit: "score", dataType: "estimated", source: "Benchmark", retrievedAt: "" },
        overallScore: 80,
        costBreakdownUsd: { compute: Number(rec.monthlyCostUsd || defaultCost), storage: 0, transfer: 0, requests: 0 },
      };
    }
    return {
      id: `fallback-${defaultProv}`,
      provider: defaultProv,
      configName: fallbackName,
      service: defaultProv === "aws" ? "EC2" : defaultProv === "gcp" ? "Compute Engine" : "Virtual Machines",
      providerRegion: "auto",
      regionLabel: "Selected Region",
      vcpu: input.cpuCores || 4,
      ramGb: input.ramGb || 16,
      storageGb: input.storageGb || 100,
      runtimeHoursPerDay: input.runtimeHoursPerDay || 8,
      monthlyCostUsd: { value: defaultCost, unit: "USD", dataType: "estimated", source: "Catalog", retrievedAt: "" },
      monthlyCo2eKg: { value: defaultCo2, unit: "kg", dataType: "estimated", source: "Catalog", retrievedAt: "" },
      performanceScore: { value: 75, unit: "score", dataType: "estimated", source: "Benchmark", retrievedAt: "" },
      overallScore: 80,
      costBreakdownUsd: { compute: defaultCost, storage: 0, transfer: 0, requests: 0 },
    };
  };

  const costWinner = extractRec(recentAnalysis.recommendations?.lowerCost, "gcp", "c2-standard-4", 109, 22);
  const carbonWinner = extractRec(recentAnalysis.recommendations?.lowerCarbon, "gcp", "c2-standard-4", 109, 22);
  const balancedWinner = extractRec(recentAnalysis.recommendations?.balanced, "aws", "t4g.xlarge", 135, 32);

  const candidates: CandidateConfig[] = rawCandidates.length > 0 ? rawCandidates : [carbonWinner, costWinner, balancedWinner];
  const defaultCandidate: CandidateConfig = candidates[0] || carbonWinner;

  let selectedCandidate: CandidateConfig = carbonWinner;
  let tabNote = "Lowest carbon emissions footprint";
  if (view === "Urgent Execution") {
    selectedCandidate = costWinner || balancedWinner || defaultCandidate;
    tabNote = "Lowest spend for immediate launch";
  } else if (view === "Balanced Fit") {
    selectedCandidate = balancedWinner || defaultCandidate;
    tabNote = "Optimal balance of cost, carbon & performance";
  }

  // Retrieve duration info
  let storedDuration: { durationValue?: number; durationUnit?: 'hours' | 'days' | 'weeks'; urgency?: 'urgent' | 'flexible' } | null = null;
  try {
    const raw = (typeof window !== "undefined")
      ? (localStorage.getItem(`workload_duration_${recentAnalysis.id}`) || localStorage.getItem("latest_workload_duration"))
      : null;
    if (raw) storedDuration = JSON.parse(raw);
  } catch {
    // ignore
  }

  const durationValue = Number(input.durationValue ?? storedDuration?.durationValue ?? (input.runtimeHoursPerDay || 4));
  const durationUnit = input.durationUnit ?? storedDuration?.durationUnit ?? "hours";
  const dailyHours = input.runtimeHoursPerDay || (durationUnit === "hours" ? durationValue : 8);

  let durationRatio = durationValue / (30 * dailyHours);
  if (durationUnit === "days") durationRatio = durationValue / 30;
  else if (durationUnit === "weeks") durationRatio = (durationValue * 7) / 30;

  // Selected candidate pro-rated metrics
  const rawCost = getCandidateCost(selectedCandidate);
  const rawCarbon = getCandidateCarbon(selectedCandidate);
  const periodCost = rawCost * durationRatio;
  const periodCarbon = rawCarbon * durationRatio;

  // Compute positions on 2D chart for AWS, GCP, Azure
  const providerList = ["aws", "gcp", "azure"] as const;
  const providerCandidates: CandidateConfig[] = providerList.map((p) => {
    return (
      candidates.find((c) => c.provider === p) ||
      extractRec(undefined, p, p === "aws" ? "t4g.xlarge" : p === "gcp" ? "c2-standard-4" : "D4as_v5", p === "aws" ? 135 : p === "gcp" ? 109 : 142, p === "aws" ? 32 : p === "gcp" ? 22 : 38)
    );
  });

  const costs = providerCandidates.map(getCandidateCost);
  const carbons = providerCandidates.map(getCandidateCarbon);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const minCarbon = Math.min(...carbons);
  const maxCarbon = Math.max(...carbons);

  const points = providerCandidates.map((c, idx) => {
    const prov = providerList[idx];
    const cost = getCandidateCost(c);
    const carbon = getCandidateCarbon(c);
    // Cost: minCost at 22% (left), maxCost at 78% (right)
    const x = Math.round(minCost === maxCost ? 50 : ((cost - minCost) / (maxCost - minCost || 1)) * 52 + 24);
    // Carbon: lower carbon is at top (75%), higher carbon at bottom (25%)
    const y = Math.round(minCarbon === maxCarbon ? 50 : (1 - (carbon - minCarbon) / (maxCarbon - minCarbon || 1)) * 48 + 25);
    const label = prov === "aws" ? "AWS" : prov === "gcp" ? "GCP" : "Azure";
    const color = prov === "aws" ? "bg-provider-aws" : prov === "gcp" ? "bg-provider-gcp" : "bg-provider-azure";
    return { provider: prov, label, color, x, y, candidate: c };
  });

  const activePoint = points.find((p) => p.candidate.id === selectedCandidate.id) ||
                      points.find((p) => p.provider === selectedCandidate.provider) ||
                      points[0];

  const pName = providerLabelMap[selectedCandidate.provider] || selectedCandidate.provider;

  return (
    <div className="rounded-xl border bg-card p-4 elevation-3 sm:p-6">
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-success">Latest Workload Activity</p>
          </div>
          <p className="mt-1 font-semibold text-sm">
            {formatWorkload(input.workloadType || "web_app")} · {input.cpuCores || 4} vCPU · {input.ramGb || 16} GB · {durationValue} {durationUnit}
          </p>
        </div>
        <div className="grid grid-cols-3 rounded-md border p-1 text-xs">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => onView(item)}
              className={`min-h-9 rounded px-2.5 text-[11px] font-semibold transition-colors ${
                view === item ? "bg-secondary text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={view === item}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-5 h-72 rounded-lg border bg-muted/30" role="img" aria-label={`Cost versus carbon scatter for ${formatWorkload(input.workloadType || "web_app")}.`}>
        <span className="absolute left-3 top-3 text-[10px] text-muted-foreground font-medium">🌿 Lower carbon footprint</span>
        <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground font-medium">Higher cost</span>
        <div className="absolute inset-x-8 bottom-9 top-8 border-b border-l">
          <div className="absolute left-1/2 top-0 h-full border-l border-dashed border-border" />
          <div className="absolute left-0 top-1/2 w-full border-t border-dashed border-border" />
          {points.map((point) => (
            <span
              key={point.label}
              className={`absolute grid size-9 -translate-x-1/2 translate-y-1/2 place-items-center rounded-full text-[9px] font-bold text-primary-foreground ${point.color}`}
              style={{ left: `${point.x}%`, bottom: `${point.y}%` }}
            >
              {point.label}
            </span>
          ))}
          {activePoint && (
            <span
              className="absolute size-14 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-primary bg-primary/15 transition-[left,bottom] duration-300"
              style={{ left: `${activePoint.x}%`, bottom: `${activePoint.y}%` }}
            />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-sm">{pName} ({selectedCandidate.configName || selectedCandidate.service})</p>
          <p className="truncate text-xs text-muted-foreground">{tabNote}</p>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground">Period spend ({durationValue} {durationUnit})</p>
            <p className="metric text-sm font-semibold">
              ${periodCost < 1 ? periodCost.toFixed(2) : periodCost < 10 ? periodCost.toFixed(2) : Math.round(periodCost).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Carbon</p>
            <p className="metric text-sm font-semibold text-success">
              {periodCarbon > 0 && periodCarbon < 0.01 ? "< 0.01" : periodCarbon < 1 ? periodCarbon.toFixed(2) : periodCarbon.toFixed(1)} kg CO₂e
            </p>
          </div>
          {recentAnalysis.id && (
            <Button asChild size="sm" variant="default" className="gap-1.5 font-semibold text-xs ml-2">
              <Link to="/results/$id" params={{ id: recentAnalysis.id }}>
                View Results
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Benefits() {
  const lead = {
    title: "Carbon-First Cloud Optimization",
    text: "Evaluate real-time greenhouse gas emissions (kg CO₂e) based on dynamic regional grid intensities and PUE factors, keeping sustainability as the locked primary metric.",
  };
  const benefits = [
    {
      icon: Clock,
      title: "Urgent vs Flexible Scheduling",
      text: "Specify whether your workload must run immediately or can wait for green solar/wind peaks or cleaner regions to cut carbon by up to 70%.",
    },
    {
      icon: ExternalLink,
      title: "1-Click Direct Cloud Deployment",
      text: "When you select the optimal recommendation, directly launch into AWS EC2, Google Cloud Compute Engine, or Azure Virtual Machines consoles.",
    },
  ];

  return (
    <section className="border-y bg-card">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-[1.25fr_0.75fr]">
          <article className="bg-card p-6 sm:p-8 lg:row-span-2">
            <span className="grid size-11 place-items-center rounded-lg bg-secondary text-primary">
              <Leaf className="size-5" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold">{lead.title}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{lead.text}</p>
            <div className="mt-8 grid grid-cols-3 gap-2" aria-hidden="true">
              {[62, 44, 78].map((h, i) => (
                <div key={h} className="flex h-24 items-end rounded bg-muted p-2">
                  <span
                    className={`w-full rounded-sm ${i === 0 ? "bg-provider-aws" : i === 1 ? "bg-provider-gcp" : "bg-provider-azure"}`}
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </article>
          {benefits.map(({ icon: Icon, title, text }) => (
            <article key={title} className="grid grid-cols-[auto_1fr] gap-4 bg-card p-6">
              <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Cloud,
      title: "1. Select Real-World Workload",
      text: "Pick from E-Commerce, Microservice APIs, Big Data ETL, AI/ML, or Database workloads.",
    },
    {
      icon: Clock,
      title: "2. Set Timeframe & Urgency",
      text: "Specify hours, days, or weeks needed, and choose urgent execution or carbon-aware scheduling.",
    },
    {
      icon: ExternalLink,
      title: "3. Review & Deploy Instantly",
      text: "Get duration-adjusted costs, carbon metrics, green window insights, and 1-click cloud console deployment.",
    },
  ];

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold">How It Works</h2>
      <div className="mt-7 grid gap-8 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <div key={title} className="grid grid-cols-[auto_1fr] gap-4">
            <span className="metric grid size-10 place-items-center rounded-full border bg-card text-sm font-semibold text-primary">
              {index + 1}
            </span>
            <div>
              <Icon className="size-5 text-primary" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
