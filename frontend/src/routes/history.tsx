import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock3, History as HistoryIcon, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DemoBanner, EmptyState, PageHeader, formatWorkload, providerLabelMap, BackButton } from "@/components/app-ui";
import { apiClient } from "@/api";
import type { AnalysisResult, CandidateConfig } from "@/types";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Analysis History · Real-Time Carbon Estimator" },
      { name: "description", content: "Review, revisit, and remove previous multi-cloud workload analyses." },
      { property: "og:title", content: "Analysis History · Real-Time Carbon Estimator" },
      { property: "og:description", content: "Review, revisit, and remove previous multi-cloud workload analyses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

type SortMode = "newest" | "cost" | "carbon";

function getCost(c?: CandidateConfig): number {
  if (!c) return Infinity;
  return c.monthlyCostUsd?.value ?? (c as any).cost?.value ?? Infinity;
}
function getCarbon(c?: CandidateConfig): number {
  if (!c) return Infinity;
  return c.monthlyCo2eKg?.value ?? (c as any).carbon?.value ?? Infinity;
}
function getVcpu(item: AnalysisResult): number {
  return item.input.cpuCores;
}
function getRegionLabel(item: AnalysisResult): string {
  const regMap: Record<string, string> = {
    india: "India",
    us_east: "US East",
    europe_west: "Western Europe",
    southeast_asia: "Southeast Asia",
  };
  return regMap[item.input.regionGroup] || (item.input as any).region || item.input.regionGroup || "Region";
}

function HistoryPage() {
  const [items, setItems] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");

  useEffect(() => {
    apiClient.listAnalyses().then(setItems).finally(() => setLoading(false));
  }, []);

  const candidate = (item: AnalysisResult, id: string) => (item.candidates || []).find((entry) => entry.id === id);

  const shown = useMemo(
    () =>
      items
        .filter((item) => `${formatWorkload(item.input.workloadType)} ${getRegionLabel(item)}`.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => {
          if (sort === "newest") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
          const aid = sort === "cost" ? a.recommendations.lowerCost : a.recommendations.lowerCarbon;
          const bid = sort === "cost" ? b.recommendations.lowerCost : b.recommendations.lowerCarbon;
          const av = candidate(a, aid);
          const bv = candidate(b, bid);
          return sort === "cost" ? getCost(av) - getCost(bv) : getCarbon(av) - getCarbon(bv);
        }),
    [items, query, sort]
  );

  function remove(item: AnalysisResult) {
    let cancelled = false;
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    toast("Analysis deleted", {
      description: `${formatWorkload(item.input.workloadType)} · ${getRegionLabel(item)}`,
      action: {
        label: "Undo",
        onClick: () => {
          cancelled = true;
          setItems((current) => [item, ...current]);
        },
      },
    });
    window.setTimeout(() => {
      if (!cancelled) void apiClient.deleteAnalysis(item.id);
    }, 5000);
  }

  function clear() {
    const previous = items;
    let cancelled = false;
    setItems([]);
    toast("History cleared", {
      action: {
        label: "Undo",
        onClick: () => {
          cancelled = true;
          setItems(previous);
        },
      },
    });
    window.setTimeout(() => {
      if (!cancelled) void Promise.all(previous.map((item) => apiClient.deleteAnalysis(item.id)));
    }, 5000);
  }

  const isMockMode = items.some((item) => item.dataMode === "mock");

  return (
    <div>
      {isMockMode && <DemoBanner />}
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <BackButton label="Back" fallbackTo="/" />
          <span className="text-border">/</span>
          <Link to="/" className="hover:text-foreground">Overview</Link>
          <span className="text-border">/</span>
          <span className="font-medium text-foreground">History</span>
        </div>
        <PageHeader
          eyebrow="Workspace · History"
          title="Previous analyses"
          description="Search saved comparisons and revisit how different priorities shaped the recommendations."
          action={items.length ? <Button variant="outline" size="sm" onClick={clear}><Trash2 />Clear all</Button> : undefined}
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
            <Input aria-label="Search analyses" placeholder="Search workload or region" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" />
          </div>
          <select aria-label="Sort analyses" value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
            <option value="newest">Newest first</option>
            <option value="cost">Lowest cost</option>
            <option value="carbon">Lowest carbon</option>
          </select>
        </div>

        {loading ? (
          <HistorySkeleton />
        ) : shown.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={HistoryIcon}
              title={items.length ? "No matching analyses" : "No analyses yet"}
              description={items.length ? "Try a different workload or region." : "Your saved workload comparisons will appear here."}
              action={
                <Button asChild>
                  <Link to="/configure">Analyze a workload</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {shown.map((item) => (
              <HistoryRow key={item.id} item={item} onDelete={() => void remove(item)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="mt-6 grid gap-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="skeleton h-36 rounded-lg" />
      ))}
    </div>
  );
}

function HistoryRow({ item, onDelete }: { item: AnalysisResult; onDelete: () => void }) {
  const find = (id: string) => (item.candidates || []).find((entry) => entry.id === id);

  const lowerCostCand = find(item.recommendations?.lowerCost);
  const lowerCarbonCand = find(item.recommendations?.lowerCarbon);
  const balancedCand = find(item.recommendations?.balanced);

  const results = [
    { label: "Lowest cost", value: lowerCostCand },
    { label: "Lowest carbon", value: lowerCarbonCand },
    { label: "Balanced", value: balancedCand },
  ];

  return (
    <article className="rounded-lg border bg-card p-4 elevation-1 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(420px,1.4fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
            <HistoryIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{formatWorkload(item.input.workloadType)}</h2>
              <span className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">{getRegionLabel(item)}</span>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              <span>·</span>
              <Clock3 className="size-3.5" />
              {getVcpu(item)} vCPU / {item.input.ramGb} GB
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {results.map(({ label, value }) => {
            const cost = value ? getCost(value) : null;
            const carbon = value ? getCarbon(value) : null;
            const pName = value ? providerLabelMap[value.provider] || String(value.provider) : "No result";

            return (
              <div key={label} className="rounded-md bg-muted/60 p-3">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="mt-1 truncate text-xs font-semibold">{pName}</p>
                <p className="metric mt-1 text-[10px] text-primary">{value && cost !== Infinity ? `$${cost} · ${carbon} kg` : "—"}</p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/results/$id" params={{ id: item.id }}>View details</Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Delete ${formatWorkload(item.input.workloadType)} analysis`} onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </div>
    </article>
  );
}