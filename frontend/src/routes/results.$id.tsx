import { Link, createFileRoute } from "@tanstack/react-router";
import { BarChart3, Check, ChevronDown, Clock, ExternalLink, GitCompareArrows, Info, Leaf, Printer, RotateCcw, ShieldCheck, Table2, TrendingDown, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/api";
import { CandidateCard, CarbonGeoShiftSimulator, DataBadge, DemoBanner, EmptyState, formatWorkload, GreenImpactTranslator, getProviderConsoleUrl, LiveGridTelemetryCard, PageHeader, providerClass, providerLabelMap, providerShort, ProviderSustainabilityBadge, ScopeCarbonBreakdown, BackButton } from "@/components/app-ui";
import { REGIONAL_GRID_SIGNALS, type AnalysisResult, type CandidateConfig, type RegionGroup } from "@/types";

export const Route = createFileRoute("/results/$id")({
  head: () => ({
    meta: [
      { title: "Analysis results · Real-Time Carbon Footprint Estimator" },
      { name: "description", content: "Review computed real-time cost, carbon emissions, and carbon-aware scheduling recommendations across cloud providers." },
      { property: "og:title", content: "Analysis results · Real-Time Carbon Footprint Estimator" },
      { property: "og:description", content: "Review computed real-time cost, carbon emissions, and carbon-aware scheduling recommendations across cloud providers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = Route.useParams();
  const [analysis, setAnalysis] = useState<AnalysisResult>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getAnalysis(id).then(setAnalysis).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingResults />;
  if (!analysis)
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          title="Analysis not found"
          description="This saved analysis is unavailable or has been removed."
          action={
            <Button asChild>
              <Link to="/configure">Start a new analysis</Link>
            </Button>
          }
        />
      </div>
    );

  return <ResultsView analysis={analysis} />;
}

function LoadingResults() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="skeleton h-10 w-48 rounded" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="skeleton h-72 rounded-lg" />
        ))}
      </div>
      <div className="skeleton mt-8 h-96 rounded-lg" />
    </div>
  );
}

function getCost(c?: CandidateConfig): number {
  if (!c) return 0;
  return c.monthlyCostUsd?.value ?? (c as any).cost?.value ?? 0;
}
function getCarbon(c?: CandidateConfig): number {
  if (!c) return 0;
  return c.monthlyCo2eKg?.value ?? (c as any).carbon?.value ?? 0;
}
function getPerf(c?: CandidateConfig): number {
  if (!c) return 0;
  return c.performanceScore?.value ?? (c as any).performance?.value ?? 0;
}
function getVcpu(c?: CandidateConfig): number {
  if (!c) return 0;
  return c.vcpu ?? (c as any).cpuCores ?? 0;
}

function ResultsView({ analysis }: { analysis: AnalysisResult }) {
  const [methodOpen, setMethodOpen] = useState(false);
  const [chartTable, setChartTable] = useState(false);

  const candidates = analysis.candidates || [];
  const find = (id: string) => candidates.find((item) => item.id === id);
  const cost = find(analysis.recommendations.lowerCost);
  const carbon = find(analysis.recommendations.lowerCarbon);
  const balanced = find(analysis.recommendations.balanced);

  const recommendationIds = [analysis.recommendations.lowerCost, analysis.recommendations.lowerCarbon, analysis.recommendations.balanced];
  const recLabels: Record<string, string[]> = {};
  recommendationIds.forEach((id, index) => {
    const label = ["Lowest cost", "Lowest carbon", "Balanced"][index];
    if (!label || !id) return;
    if (!recLabels[id]) recLabels[id] = [];
    recLabels[id].push(label);
  });

  const maxCost = Math.max(...candidates.map(getCost), 1);
  const maxCarbon = Math.max(...candidates.map(getCarbon), 1);

  const costCarbonDelta = cost && carbon && getCarbon(carbon) > 0 ? Math.round((getCarbon(cost) / getCarbon(carbon) - 1) * 100) : 0;
  const carbonCostDelta = cost && carbon && getCost(cost) > 0 ? Math.round((getCost(carbon) / getCost(cost) - 1) * 100) : 0;

  const regGroup = (analysis.input.regionGroup || "india") as RegionGroup;
  const regLabel = analysis.input.regionGroup || (analysis.input as any).region || "Selected Region";
  const gridSignal = REGIONAL_GRID_SIGNALS[regGroup] || REGIONAL_GRID_SIGNALS.india;

  // Calculate Duration and Period Cost & Carbon
  let storedDuration: { durationValue?: number; durationUnit?: 'hours' | 'days' | 'weeks'; urgency?: 'urgent' | 'flexible' } | null = null;
  try {
    const raw = (typeof window !== "undefined")
      ? (localStorage.getItem(`workload_duration_${analysis.id}`) || localStorage.getItem("latest_workload_duration"))
      : null;
    if (raw) storedDuration = JSON.parse(raw);
  } catch {
    // ignore
  }

  const durationValue = Number(analysis.input.durationValue ?? storedDuration?.durationValue ?? (analysis.input.runtimeHoursPerDay || 4));
  const durationUnit = analysis.input.durationUnit ?? storedDuration?.durationUnit ?? "hours";
  const urgency = analysis.input.urgency ?? storedDuration?.urgency ?? "urgent";

  const dailyHours = analysis.input.runtimeHoursPerDay || (durationUnit === "hours" ? durationValue : 8);
  let totalHours = durationValue;
  let durationRatio = durationValue / (30 * dailyHours);
  if (durationUnit === "days") {
    totalHours = durationValue * dailyHours;
    durationRatio = durationValue / 30;
  } else if (durationUnit === "weeks") {
    totalHours = durationValue * 7 * dailyHours;
    durationRatio = (durationValue * 7) / 30;
  }

  // Build deduplicated recommendations to guarantee 3 distinct, non-repeated options across cloud providers
  const displayCards: Array<{
    id: string;
    icon: typeof TrendingDown;
    title: string;
    candidate: CandidateConfig;
    also?: string | undefined;
    reason: string;
  }> = [];

  const usedCandidateIds = new Set<string>();

  const getBestCandidateForProvider = (provider: string, excludeIds: Set<string>): CandidateConfig | undefined => {
    return candidates
      .filter((c) => c.provider === provider && !excludeIds.has(c.id))
      .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))[0];
  };

  const getNextBestCandidate = (excludeIds: Set<string>): CandidateConfig | undefined => {
    return candidates
      .filter((c) => !excludeIds.has(c.id))
      .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))[0];
  };

  // Case 1: All 3 recommendations point to the same candidate (e.g. GCP c2-standard-4 swept lowest cost, lowest carbon, and balanced)
  if (cost && carbon && balanced && cost.id === carbon.id && cost.id === balanced.id) {
    displayCards.push({
      id: balanced.id,
      icon: Trophy,
      title: "🏆 Overall Multi-Cloud Champion",
      candidate: balanced,
      also: "Lowest Cost & Lowest Carbon",
      reason: `Swept all categories with lowest cost and lowest carbon emissions in ${regLabel}.`,
    });
    usedCandidateIds.add(balanced.id);

    const otherProviders = ["aws", "gcp", "azure"].filter((p) => p !== balanced.provider);
    for (const prov of otherProviders) {
      const alt = getBestCandidateForProvider(prov, usedCandidateIds);
      if (alt) {
        usedCandidateIds.add(alt.id);
        const pName = providerLabelMap[prov] || prov;
        displayCards.push({
          id: alt.id,
          icon: Leaf,
          title: `Best ${pName} Alternative`,
          candidate: alt,
          also: `Cleanest ${pName}`,
          reason: `Leading ${pName} configuration for this workload profile.`,
        });
      }
    }
  } else if (cost && carbon && cost.id === carbon.id) {
    // Case 2: Cost & Carbon are identical, Balanced is distinct
    displayCards.push({
      id: cost.id,
      icon: Leaf,
      title: "🏆 Lowest Cost & Carbon Option",
      candidate: cost,
      also: "Dual Winner",
      reason: "Achieves both lowest spend and lowest carbon emissions.",
    });
    usedCandidateIds.add(cost.id);

    if (balanced && !usedCandidateIds.has(balanced.id)) {
      displayCards.push({
        id: balanced.id,
        icon: Trophy,
        title: "Top Balanced Recommendation",
        candidate: balanced,
        reason: "Best overall balance across performance, cost, and sustainability.",
      });
      usedCandidateIds.add(balanced.id);
    }

    const representedProviders = new Set(displayCards.map((c) => c.candidate.provider));
    const unrepresented = ["aws", "gcp", "azure"].find((p) => !representedProviders.has(p as any));
    const alt = (unrepresented ? getBestCandidateForProvider(unrepresented, usedCandidateIds) : undefined) || getNextBestCandidate(usedCandidateIds);
    if (alt) {
      usedCandidateIds.add(alt.id);
      const pName = providerLabelMap[alt.provider] || alt.provider;
      displayCards.push({
        id: alt.id,
        icon: TrendingDown,
        title: `Best ${pName} Alternative`,
        candidate: alt,
        also: `Multi-cloud alternative`,
        reason: `Leading ${pName} option to compare across providers.`,
      });
    }
  } else {
    // Case 3: Distinct or partial overlap
    if (cost) {
      displayCards.push({
        id: cost.id,
        icon: TrendingDown,
        title: "Lowest Cost Option",
        candidate: cost,
        also: cost.id === balanced?.id ? "Also top balanced" : undefined,
        reason: "Has the lowest estimated spend for this period.",
      });
      usedCandidateIds.add(cost.id);
    }

    if (carbon && !usedCandidateIds.has(carbon.id)) {
      displayCards.push({
        id: carbon.id,
        icon: Leaf,
        title: "Lowest Carbon Option",
        candidate: carbon,
        also: carbon.id === balanced?.id ? "Also top balanced" : undefined,
        reason: "Has the absolute lowest carbon emissions footprint.",
      });
      usedCandidateIds.add(carbon.id);
    }

    if (balanced && !usedCandidateIds.has(balanced.id)) {
      displayCards.push({
        id: balanced.id,
        icon: Trophy,
        title: "Top Balanced Recommendation",
        candidate: balanced,
        reason: "Best overall multi-criteria performance and carbon score.",
      });
      usedCandidateIds.add(balanced.id);
    }

    while (displayCards.length < 3) {
      const representedProviders = new Set(displayCards.map((c) => c.candidate.provider));
      const unrepresented = ["aws", "gcp", "azure"].find((p) => !representedProviders.has(p as any));
      const alt = (unrepresented ? getBestCandidateForProvider(unrepresented, usedCandidateIds) : undefined) || getNextBestCandidate(usedCandidateIds);
      if (!alt) break;
      usedCandidateIds.add(alt.id);
      const pName = providerLabelMap[alt.provider] || alt.provider;
      displayCards.push({
        id: alt.id,
        icon: Leaf,
        title: `Best ${pName} Alternative`,
        candidate: alt,
        also: `Alternative`,
        reason: `Strong ${pName} contender for this workload.`,
      });
    }
  }

  return (
    <div>
      {analysis.dataMode === "mock" && <DemoBanner />}
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <BackButton label="Back" fallbackTo="/history" />
          <span className="text-border">/</span>
          <Link to="/history" className="hover:text-foreground">History</Link>
          <span className="text-border">/</span>
          <span className="font-medium text-foreground">Results</span>
        </div>

        <PageHeader
          eyebrow="Real-Time Carbon Footprint Estimator · Analysis Results"
          title={`${formatWorkload(analysis.input.workloadType)} Analysis`}
          description={`Period: ${durationValue} ${durationUnit} · ${regLabel} · ${analysis.input.cpuCores} vCPU · ${analysis.input.ramGb} GB RAM · Carbon: 100% Core Focus`}
          action={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5"
                title="Print or save Executive Carbon Audit Report as PDF"
              >
                <Printer className="size-3.5" />
                Audit Report (PDF)
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/configure">
                  <RotateCcw />New analysis
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/compare/$id" params={{ id: analysis.id }}>
                  <GitCompareArrows />Compare all
                </Link>
              </Button>
            </>
          }
        />

        {/* Live Grid Intensity Telemetry Card */}
        <div className="mt-6">
          <LiveGridTelemetryCard regionGroup={regGroup} />
        </div>

        {/* Carbon-Aware Scheduling & Green Window Advisor */}
        <div className="mt-6 rounded-lg border bg-card p-5 elevation-1">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2.5">
              <span className={`p-1.5 rounded-md ${urgency === 'urgent' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                {urgency === 'urgent' ? <Zap className="size-4" /> : <Leaf className="size-4" />}
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {urgency === 'urgent' ? '⚡ Urgent Mode: Immediate Execution Advisor' : '🌿 Carbon-Aware Scheduling Advisor'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Real-time regional grid intelligence & scheduling recommendations
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Live Grid: {gridSignal.intensity} gCO₂e/kWh ({gridSignal.status})
            </Badge>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border bg-muted/30 p-3.5">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                {urgency === 'urgent' ? 'Immediate Execution Advice' : 'Optimal Scheduling Window'}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {urgency === 'urgent'
                  ? `For immediate launch, ${providerLabelMap[balanced?.provider || 'gcp']} (${balanced?.configName || 'optimal VM'}) is your cleanest option in ${regLabel}, emitting ${(getCarbon(balanced || candidates[0]) * durationRatio).toFixed(2)} kg CO₂e during your ${durationValue} ${durationUnit}.`
                  : `This workload is flexible! To minimize carbon emissions, schedule execution during the optimal green window: ${gridSignal.greenWindow}. Grid emissions drop significantly during this period.`}
              </p>
            </div>

            <div className="rounded-md border border-success/30 bg-success/5 p-3.5">
              <p className="text-xs font-semibold text-success flex items-center gap-1.5">
                <Leaf className="size-3.5" />
                Clean Region Shift Opportunity
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                {gridSignal.optimalAlternativeRegion
                  ? `Shifting to ${gridSignal.optimalAlternativeRegion.name} cuts your carbon footprint by up to ${gridSignal.optimalAlternativeRegion.savingsPercent}% (saving ~${((getCarbon(balanced || candidates[0]) * durationRatio) * (gridSignal.optimalAlternativeRegion.savingsPercent / 100)).toFixed(2)} kg CO₂e)!`
                  : `Western Europe is currently operating on high wind/solar penetration (210 gCO₂e/kWh), giving you maximum clean energy efficiency.`}
              </p>
            </div>
          </div>
        </div>

        <nav aria-label="Result sections" className="sticky top-16 z-30 mt-6 hidden rounded-md border bg-background/95 p-1 elevation-1 backdrop-blur lg:flex">
          <a href="#overview" className="flex min-h-10 items-center rounded px-4 text-sm hover:bg-muted">Overview</a>
          <a href="#charts" className="flex min-h-10 items-center rounded px-4 text-sm hover:bg-muted">Charts</a>
          <a href="#details" className="flex min-h-10 items-center rounded px-4 text-sm hover:bg-muted">Details</a>
          <a href="#methodology" className="flex min-h-10 items-center rounded px-4 text-sm hover:bg-muted">Methodology</a>
        </nav>

        <section id="overview" className="scroll-mt-32 mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold">Recommendations</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Showing estimated cost and carbon for your required period: <strong>{durationValue} {durationUnit}</strong>.
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
              🌿 Carbon-First Optimization 100% Active
            </Badge>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {displayCards.map((card) => (
              <RecommendationCard
                key={card.id + card.title}
                icon={card.icon}
                title={card.title}
                candidate={card.candidate}
                peers={candidates}
                also={card.also}
                reason={card.reason}
                durationValue={durationValue}
                durationUnit={durationUnit}
                durationRatio={durationRatio}
              />
            ))}
          </div>

          {cost && carbon && cost.id !== carbon.id && (
            <div className="mt-5 rounded-lg border bg-card p-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Choose lower cost</p>
                  <p className="text-sm font-semibold">Save {carbonCostDelta}% on spend</p>
                </div>
                <div className="flex h-4 overflow-hidden rounded-full">
                  <span className="w-1/2 bg-cost" />
                  <span className="w-1/2 bg-carbon" />
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-muted-foreground">Choose lower carbon</p>
                  <p className="text-sm font-semibold">Cut carbon emissions by {costCarbonDelta}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Real-World Green Impact Equivalency Translator */}
          <div className="mt-8">
            <GreenImpactTranslator
              savedCo2Kg={Math.max(0.01, (Math.max(...candidates.map(getCarbon), 1) - Math.min(...candidates.map(getCarbon), 1)) * durationRatio)}
              durationValue={durationValue}
              durationUnit={durationUnit}
            />
          </div>

          {/* Follow-the-Sun Carbon Geo-Shift Simulator */}
          <div className="mt-8">
            <CarbonGeoShiftSimulator
              currentRegion={regGroup}
              currentEmissionsKg={Math.min(...candidates.map(getCarbon), 1) * durationRatio}
              durationValue={durationValue}
              durationUnit={durationUnit}
            />
          </div>

          {/* Scope 2 vs Scope 3 Carbon Accounting */}
          <div className="mt-8">
            <ScopeCarbonBreakdown
              operationalCo2Kg={Math.min(...candidates.map(getCarbon), 1) * durationRatio}
              vcpu={analysis.input.cpuCores}
              runtimeHours={totalHours}
            />
          </div>
        </section>

        <section id="details" className="scroll-mt-32 mt-10">
          <h2 className="text-xl font-semibold">Provider comparison</h2>
          <p className="mt-1 text-sm text-muted-foreground">Top configuration from each cloud provider for this workload with direct deployment links.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {candidates
              .filter((item, index, all) => all.findIndex((e) => e.provider === item.provider) === index)
              .map((candidate) => {
                const bestId = analysis.providerBest[candidate.provider];
                const selected = candidates.find((item) => item.id === bestId) ?? candidate;
                return <CandidateCard key={candidate.provider} candidate={selected} recommended={recLabels[selected.id]} />;
              })}
          </div>
        </section>

        <section id="charts" className="scroll-mt-32 mt-10 rounded-lg border bg-card p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <h2 className="text-xl font-semibold">Metric comparison</h2>
              <p className="mt-1 text-sm text-muted-foreground">Lower is better for cost and carbon. Higher is better for performance.</p>
            </div>
            <div className="grid grid-cols-2 rounded-md border p-1">
              <Button variant={!chartTable ? "secondary" : "ghost"} size="sm" onClick={() => setChartTable(false)} aria-pressed={!chartTable}>
                <BarChart3 />Chart
              </Button>
              <Button variant={chartTable ? "secondary" : "ghost"} size="sm" onClick={() => setChartTable(true)} aria-pressed={chartTable}>
                <Table2 />Table
              </Button>
            </div>
          </div>
          {chartTable ? <MetricTable candidates={candidates} /> : <MetricCharts candidates={candidates} maxCost={maxCost} maxCarbon={maxCarbon} />}
        </section>

        <section id="methodology" className="scroll-mt-32 mt-6 rounded-lg border bg-card">
          <button onClick={() => setMethodOpen((value) => !value)} className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-5 text-left" aria-expanded={methodOpen}>
            <div>
              <h2 className="font-semibold">Methodology & Assumptions</h2>
              <p className="mt-1 text-xs text-muted-foreground">Click to inspect underlying calculation rules and assumptions</p>
            </div>
            <ChevronDown className={`size-4 transition-transform ${methodOpen ? "rotate-180" : ""}`} />
          </button>
          {methodOpen && (
            <div className="grid gap-5 border-t p-5 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <strong className="text-foreground">Required Period Billing:</strong>
                <p className="mt-1">Pro-rated for your specific duration ({durationValue} {durationUnit}) based on active runtime hours.</p>
              </div>
              <div>
                <strong className="text-foreground">List Pricing:</strong>
                <p className="mt-1">On-demand public list prices used. Reserved instances, savings plans, committed use discounts, and free tier allowances are excluded in V1.</p>
              </div>
              <div>
                <strong className="text-foreground">Location-Based Carbon:</strong>
                <p className="mt-1">Location-based grid emissions intensity × PUE × hardware power draw coefficients (CPU, RAM, Storage, Egress). Market-based renewable purchases not applied.</p>
              </div>
              <div>
                <strong className="text-foreground">Workload Profile Utilization:</strong>
                <p className="mt-1">Utilizes standardized workload profiles (Web/API: 40%, Data Processing/ML: 70%, Other: 50%) applied equally to all providers.</p>
              </div>
              <div>
                <strong className="text-foreground">Regional Carbon Proximity:</strong>
                <p className="mt-1">Providers in the same country share regional grid carbon intensity, resulting in similar emissions figures for equivalent hardware.</p>
              </div>
              <div>
                <strong className="text-foreground">Performance Score Rubric:</strong>
                <p className="mt-1">0–100 score derived 70% from per-vCPU relative compute performance index and 30% from capacity headroom index above requested specs.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function RecommendationCard({
  icon: Icon,
  title,
  candidate,
  peers,
  also,
  reason,
  durationValue,
  durationUnit,
  durationRatio,
}: {
  icon: typeof TrendingDown;
  title: string;
  candidate?: CandidateConfig | undefined;
  peers: CandidateConfig[];
  also?: string | undefined;
  reason: string;
  durationValue: number;
  durationUnit: string;
  durationRatio: number;
}) {
  if (!candidate) return <article className="rounded-lg border bg-card p-6">Unavailable</article>;

  const cost = getCost(candidate);
  const carbon = getCarbon(candidate);
  const periodCost = cost * durationRatio;
  const periodCarbon = carbon * durationRatio;

  const maxPeersCost = Math.max(...peers.map(getCost), 1);
  const maxPeersCarbon = Math.max(...peers.map(getCarbon), 1);

  const costDelta = Math.round((1 - cost / maxPeersCost) * 100);
  const carbonDelta = Math.round((1 - carbon / maxPeersCarbon) * 100);
  const pName = providerLabelMap[candidate.provider] || String(candidate.provider);

  return (
    <article className="rounded-lg border bg-card p-5 elevation-2 sm:p-6 flex flex-col justify-between">
      <div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-secondary text-primary">
              <Icon className="size-5" />
            </span>
            <span className="text-sm font-semibold">{title}</span>
          </div>
          {also && (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
              <Check className="size-3" />
              {also}
            </Badge>
          )}
        </div>

        <p className="mt-5 text-2xl font-semibold">{pName}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{candidate.configName || candidate.service}</p>

        {/* Cost & Carbon for user required period */}
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[10px] uppercase font-bold tracking-wider text-primary">
            Period Cost ({durationValue} {durationUnit})
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="metric text-2xl font-bold text-foreground">
              ${periodCost < 1 ? periodCost.toFixed(2) : periodCost < 10 ? periodCost.toFixed(2) : Math.round(periodCost).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {periodCarbon > 0 && periodCarbon < 0.01 ? "< 0.01" : periodCarbon < 1 ? periodCarbon.toFixed(2) : periodCarbon.toFixed(1)} kg CO₂e
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Standard monthly list baseline: ${cost.toLocaleString()} / mo ({carbon} kg CO₂e)
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <MetricFigure label="Monthly list cost" value={`$${cost.toLocaleString()}`} delta={`−${costDelta}% vs highest`} sourcedValue={candidate.monthlyCostUsd} />
          <MetricFigure label="Monthly carbon" value={`${carbon} kg`} delta={`−${carbonDelta}% vs highest`} sourcedValue={candidate.monthlyCo2eKg} />
        </div>

        <Meter label="Performance Score" value={getPerf(candidate)} color="bg-performance" />
        <Meter label="Carbon-Weighted Fit" value={candidate.overallScore} color="bg-primary" />

        <p className="mt-4 text-xs text-muted-foreground">{reason}</p>
        <ProviderSustainabilityBadge provider={candidate.provider} />
      </div>

      {/* Direct Cloud Console Deployment Button */}
      <div className="mt-6 border-t pt-4">
        <Button asChild variant="default" size="sm" className="w-full gap-2 font-semibold">
          <a href={getProviderConsoleUrl(candidate.provider, candidate.configName)} target="_blank" rel="noopener noreferrer">
            Deploy on {pName}
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
        <p className="mt-1 text-center text-[10px] text-muted-foreground">
          Redirects to {pName} console to launch instance
        </p>
      </div>
    </article>
  );
}

function MetricFigure({ label, value, delta, sourcedValue }: { label: string; value: string; delta: string; sourcedValue?: CandidateConfig["monthlyCostUsd"] }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        {sourcedValue && <DataBadge value={sourcedValue} />}
      </div>
      <p className="metric mt-1 text-xl font-semibold">{value}</p>
      <p className="mt-0.5 text-[10px] text-success">{delta}</p>
    </div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mt-3.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="metric font-semibold">{value.toFixed(0)}/100</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}

function MetricCharts({ candidates, maxCost, maxCarbon }: { candidates: CandidateConfig[]; maxCost: number; maxCarbon: number }) {
  const bars = (type: "cost" | "carbon" | "performance", label: string, unit: string) => {
    const getValue = (c: CandidateConfig) => (type === "cost" ? getCost(c) : type === "carbon" ? getCarbon(c) : getPerf(c));
    const maxVal = Math.max(...candidates.map(getValue), 1);

    return (
      <div>
        <p className="mb-3 text-xs font-semibold text-muted-foreground">{label}</p>
        <div className="space-y-3">
          {candidates.map((c) => {
            const val = getValue(c);
            const pKey = String(c.provider).toLowerCase();
            const cls = providerClass[c.provider] || providerClass[pKey] || "bg-primary";
            const sName = providerShort[c.provider] || providerShort[pKey] || String(c.provider);

            return (
              <div key={c.id} className="grid grid-cols-[48px_minmax(0,1fr)_64px] items-center gap-2 text-xs sm:grid-cols-[88px_minmax(0,1fr)_84px]">
                <span className="font-medium">{sName}</span>
                <div className="h-7 overflow-hidden rounded-sm bg-muted">
                  <div className={`h-full rounded-sm ${cls}`} style={{ width: `${Math.max(8, (val / maxVal) * 100)}%` }} />
                </div>
                <span className="metric text-right">{val} {unit}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-7 grid gap-8 lg:grid-cols-2">
      <div className="lg:col-span-2">{bars("cost", "Monthly cost (USD)", "USD")}</div>
      {bars("carbon", "Carbon footprint (kg CO₂e)", "kg")}
      {bars("performance", "Performance score (0–100)", "")}

      <div className="lg:col-span-2">
        <p className="mb-3 text-xs font-semibold text-muted-foreground">Cost versus carbon scatter</p>
        <div className="relative h-72 overflow-hidden rounded-md border bg-muted/30" role="img" aria-label="Scatter plot comparing monthly cost and carbon footprint">
          <span className="absolute left-3 top-3 text-[10px] text-muted-foreground">Lower cost / lower carbon</span>
          <div className="absolute inset-x-10 bottom-10 top-8 border-b border-l">
            <div className="absolute left-1/2 h-full border-l border-dashed" />
            <div className="absolute top-1/2 w-full border-t border-dashed" />
            {candidates.map((c) => {
              const pKey = String(c.provider).toLowerCase();
              const cls = providerClass[c.provider] || providerClass[pKey] || "bg-primary";
              const sName = providerShort[c.provider] || providerShort[pKey] || String(c.provider);
              const pName = providerLabelMap[c.provider] || String(c.provider);

              return (
                <div
                  key={c.id}
                  className="absolute -translate-x-1/2 translate-y-1/2 text-center"
                  style={{
                    left: `${8 + (getCost(c) / maxCost) * 82}%`,
                    bottom: `${8 + (getCarbon(c) / maxCarbon) * 76}%`,
                  }}
                >
                  <span className={`grid size-10 place-items-center rounded-full text-[9px] font-bold text-primary-foreground elevation-1 ${cls}`}>
                    {sName}
                  </span>
                  <span className="mt-1 block text-[9px] font-semibold">{pName}</span>
                </div>
              );
            })}
          </div>
          <span className="absolute bottom-2 left-1/2 text-[10px] text-muted-foreground">Monthly cost (USD)</span>
          <span className="absolute left-1 top-1/2 -rotate-90 text-[10px] text-muted-foreground">kg CO₂e</span>
        </div>
      </div>
    </div>
  );
}

function MetricTable({ candidates }: { candidates: CandidateConfig[] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b text-xs text-muted-foreground">
          <tr>
            <th className="pb-3">Provider</th>
            <th className="pb-3">Monthly cost</th>
            <th className="pb-3">Carbon</th>
            <th className="pb-3">Performance</th>
            <th className="pb-3 text-right">Overall</th>
            <th className="pb-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="py-4 font-medium">{providerLabelMap[c.provider] || String(c.provider)}</td>
              <td className="metric py-4">${getCost(c)}</td>
              <td className="metric py-4">{getCarbon(c)} kg</td>
              <td className="metric py-4">{getPerf(c)}</td>
              <td className="metric py-4 text-right font-semibold text-primary">{c.overallScore.toFixed(0)}</td>
              <td className="py-4 text-right">
                <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <a href={getProviderConsoleUrl(c.provider, c.configName)} target="_blank" rel="noopener noreferrer">
                    Deploy
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
