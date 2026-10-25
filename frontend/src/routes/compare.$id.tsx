import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Check, Columns3, Download, ExternalLink, GitCompareArrows, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DemoBanner, EmptyState, PageHeader, ProviderMark, formatWorkload, providerLabelMap, BackButton, getProviderConsoleUrl } from "@/components/app-ui";
import { apiClient } from "@/api";
import type { AnalysisResult, CandidateConfig, ProviderId } from "@/types";

export const Route = createFileRoute("/compare/$id")({
  head: () => ({
    meta: [
      { title: "Compare Configurations · Real-Time Carbon Estimator" },
      { name: "description", content: "Sort and filter every compatible cloud configuration side by side." },
      { property: "og:title", content: "Compare Configurations · Real-Time Carbon Estimator" },
      { property: "og:description", content: "Sort and filter every compatible cloud configuration side by side." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

type SortKey = "cost" | "carbon" | "performance" | "overallScore";
type ColumnKey = "resources" | "region" | "cost" | "carbon" | "performance" | "overall";

function getCost(c: CandidateConfig): number {
  return c.monthlyCostUsd?.value ?? (c as any).cost?.value ?? 0;
}
function getCarbon(c: CandidateConfig): number {
  return c.monthlyCo2eKg?.value ?? (c as any).carbon?.value ?? 0;
}
function getPerf(c: CandidateConfig): number {
  return c.performanceScore?.value ?? (c as any).performance?.value ?? 0;
}
function getVcpu(c: CandidateConfig): number {
  return c.vcpu ?? (c as any).cpuCores ?? 0;
}
function getRegion(c: CandidateConfig): string {
  return c.regionLabel || (c as any).region || c.providerRegion || "";
}

function ComparePage() {
  const { id } = Route.useParams();
  const [analysis, setAnalysis] = useState<AnalysisResult>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getAnalysis(id).then(setAnalysis).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <CompareSkeleton />;
  if (!analysis)
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          title="Analysis not found"
          description="This saved analysis is unavailable or has been removed."
          action={
            <Button asChild>
              <Link to="/history">Back to history</Link>
            </Button>
          }
        />
      </div>
    );

  return <CompareView analysis={analysis} />;
}

function CompareSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="skeleton h-10 w-64 rounded" />
      <div className="skeleton mt-8 h-20 rounded-lg" />
      <div className="skeleton mt-4 h-80 rounded-lg" />
    </div>
  );
}

function CompareView({ analysis }: { analysis: AnalysisResult }) {
  const candidates = analysis.candidates || [];
  const [filter, setFilter] = useState<ProviderId | "All">("All");
  const [sort, setSort] = useState<SortKey>("overallScore");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<string[]>([]);
  const [columns, setColumns] = useState<Record<ColumnKey, boolean>>({
    resources: true,
    region: true,
    cost: true,
    carbon: true,
    performance: true,
    overall: true,
  });

  const visible = useMemo(
    () =>
      [...candidates.filter((c) => filter === "All" || c.provider === filter)].sort((a, b) => {
        const av = sort === "overallScore" ? a.overallScore : sort === "cost" ? getCost(a) : sort === "carbon" ? getCarbon(a) : getPerf(a);
        const bv = sort === "overallScore" ? b.overallScore : sort === "cost" ? getCost(b) : sort === "carbon" ? getCarbon(b) : getPerf(b);
        return direction === "asc" ? av - bv : bv - av;
      }),
    [candidates, filter, sort, direction]
  );

  function changeSort(next: SortKey) {
    if (sort === next) setDirection((value) => (value === "asc" ? "desc" : "asc"));
    else {
      setSort(next);
      setDirection(next === "cost" || next === "carbon" ? "asc" : "desc");
    }
  }

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current));
  }

  function exportCsv() {
    const header = ["Provider", "Config", "Service", "vCPU", "RAM GB", "Storage GB", "Runtime Hours/Day", "Region", "Monthly Cost USD", "Monthly Carbon kg CO2e", "Performance Score", "Overall Score"];
    const rows = candidates.map((item) => [
      providerLabelMap[item.provider] || String(item.provider),
      item.configName || item.service,
      item.service,
      getVcpu(item),
      item.ramGb,
      item.storageGb,
      item.runtimeHoursPerDay ?? (item as any).runtimeHours,
      getRegion(item),
      getCost(item),
      getCarbon(item),
      getPerf(item),
      item.overallScore.toFixed(1),
    ]);

    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `carbon-estimator-${analysis.id}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const chosen = selected.map((id) => candidates.find((item) => item.id === id)).filter((item): item is CandidateConfig => Boolean(item));

  return (
    <div>
      {analysis.dataMode === "mock" && <DemoBanner />}
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <BackButton label="Back" fallbackTo="/results/$id" params={{ id: analysis.id }} />
          <span className="text-border">/</span>
          <Link to="/results/$id" params={{ id: analysis.id }} className="hover:text-foreground">Results</Link>
          <span className="text-border">/</span>
          <span className="font-medium text-foreground">Compare</span>
        </div>
        <PageHeader
          eyebrow="Analysis · Compare"
          title="Compare configurations"
          description={`${formatWorkload(analysis.input.workloadType)} · Select 2–4 options for a side-by-side comparison.`}
          action={
            <>
              <Button asChild variant="outline" size="sm">
                <Link to="/results/$id" params={{ id: analysis.id }}>
                  <ArrowLeft />Results
                </Link>
              </Button>
              <Button size="sm" onClick={exportCsv}>
                <Download />Export CSV
              </Button>
            </>
          }
        />

        <div className="mt-7 grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-muted-foreground">Provider</span>
            {(["All", "aws", "gcp", "azure"] as const).map((value) => (
              <Button key={value} variant={filter === value ? "secondary" : "outline"} size="sm" onClick={() => setFilter(value)}>
                {value === "All" ? "All" : providerLabelMap[value]}
              </Button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 />Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              {(Object.keys(columns) as ColumnKey[]).map((key) => (
                <DropdownMenuCheckboxItem key={key} checked={columns[key]} onCheckedChange={(checked) => setColumns((current) => ({ ...current, [key]: Boolean(checked) }))} className="capitalize">
                  {key}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {visible.length} configurations · {selected.length}/4 selected
        </p>

        <div className="mt-4 hidden overflow-auto rounded-lg border bg-card md:block">
          <table className="w-full min-w-[1020px] text-left text-xs">
            <thead className="sticky top-16 z-20 border-b bg-muted">
              <tr>
                <th className="sticky left-0 z-30 w-12 bg-muted px-4 py-3">
                  <span className="sr-only">Select</span>
                </th>
                <th className="sticky left-12 z-30 bg-muted px-4 py-3">Provider and config</th>
                {columns.resources && <th className="px-4 py-3">Resources</th>}
                {columns.region && <th className="px-4 py-3">Region</th>}
                {columns.cost && <Sortable label="Cost" value="cost" active={sort} direction={direction} onSort={changeSort} />}
                {columns.carbon && <Sortable label="Carbon" value="carbon" active={sort} direction={direction} onSort={changeSort} />}
                {columns.performance && <Sortable label="Performance" value="performance" active={sort} direction={direction} onSort={changeSort} />}
                {columns.overall && <Sortable label="Overall" value="overallScore" active={sort} direction={direction} onSort={changeSort} />}
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((candidate, index) => (
                <tr key={candidate.id} className={`${index % 2 ? "bg-muted/30" : "bg-card"} ${selected.includes(candidate.id) ? "ring-1 ring-inset ring-primary" : ""}`}>
                  <td className={`sticky left-0 px-4 py-4 ${index % 2 ? "bg-muted" : "bg-card"}`}>
                    <Checkbox checked={selected.includes(candidate.id)} onCheckedChange={() => toggle(candidate.id)} aria-label={`Select ${candidate.provider} ${candidate.configName || candidate.service}`} />
                  </td>
                  <td className={`sticky left-12 min-w-56 px-4 py-4 ${index % 2 ? "bg-muted" : "bg-card"}`}>
                    <ProviderMark provider={candidate.provider} />
                    <p className="mt-2 text-[11px] text-muted-foreground">{candidate.configName || candidate.service}</p>
                  </td>
                  {columns.resources && <td className="metric px-4 py-4">{getVcpu(candidate)} vCPU · {candidate.ramGb} GB</td>}
                  {columns.region && <td className="px-4 py-4">{getRegion(candidate)}</td>}
                  {columns.cost && <td className="metric px-4 py-4 font-semibold">${getCost(candidate)}</td>}
                  {columns.carbon && <td className="metric px-4 py-4">{getCarbon(candidate)} kg</td>}
                  {columns.performance && <td className="metric px-4 py-4">{getPerf(candidate)}</td>}
                  {columns.overall && <td className="metric px-4 py-4 font-semibold text-primary">{candidate.overallScore.toFixed(0)}</td>}
                  <td className="px-4 py-4 text-right">
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1 font-medium hover:border-primary hover:text-primary">
                      <a href={getProviderConsoleUrl(candidate.provider, candidate.configName)} target="_blank" rel="noopener noreferrer">
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

        <div className="mt-4 grid gap-3 md:hidden">
          {visible.map((candidate) => (
            <MobileCandidate key={candidate.id} candidate={candidate} selected={selected.includes(candidate.id)} toggle={() => toggle(candidate.id)} />
          ))}
        </div>

        {chosen.length >= 2 && <CompareDrawer candidates={chosen} clear={() => setSelected([])} />}
      </div>
    </div>
  );
}

function Sortable({ label, value, active, direction, onSort }: { label: string; value: SortKey; active: SortKey; direction: "asc" | "desc"; onSort: (value: SortKey) => void }) {
  const Icon = active === value ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th aria-sort={active === value ? (direction === "asc" ? "ascending" : "descending") : "none"} className="px-2 py-1">
      <button className="flex min-h-10 w-full items-center gap-1 rounded px-2 hover:bg-background" onClick={() => onSort(value)}>
        {label}
        <Icon className="size-3" />
      </button>
    </th>
  );
}

function MobileCandidate({ candidate, selected, toggle }: { candidate: CandidateConfig; selected: boolean; toggle: () => void }) {
  return (
    <article className={`rounded-lg border bg-card p-4 ${selected ? "border-primary ring-1 ring-primary" : ""}`}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={toggle} aria-label={`Select ${candidate.provider} ${candidate.configName || candidate.service}`} className="mt-1" />
        <div className="min-w-0">
          <ProviderMark provider={candidate.provider} />
          <p className="mt-2 truncate text-xs text-muted-foreground">{candidate.configName || candidate.service}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-xs">
        <Metric label="Monthly cost" value={`$${getCost(candidate)}`} />
        <Metric label="Carbon" value={`${getCarbon(candidate)} kg`} />
        <Metric label="Performance" value={`${getPerf(candidate)}/100`} />
        <Metric label="Overall" value={candidate.overallScore.toFixed(0)} best />
      </dl>
      <div className="mt-3 border-t pt-3">
        <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs gap-1 font-medium hover:border-primary hover:text-primary">
          <a href={getProviderConsoleUrl(candidate.provider, candidate.configName)} target="_blank" rel="noopener noreferrer">
            Deploy on {providerLabelMap[candidate.provider] || String(candidate.provider)}
            <ExternalLink className="size-3" />
          </a>
        </Button>
      </div>
    </article>
  );
}

function Metric({ label, value, best }: { label: string; value: string; best?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`metric mt-1 font-semibold ${best ? "text-primary" : ""}`}>{value}</dd>
    </div>
  );
}

function CompareDrawer({ candidates, clear }: { candidates: CandidateConfig[]; clear: () => void }) {
  const bestCost = Math.min(...candidates.map(getCost));
  const bestCarbon = Math.min(...candidates.map(getCarbon));
  const bestPerformance = Math.max(...candidates.map(getPerf));

  return (
    <section className="sticky bottom-3 z-30 mt-6 rounded-lg border border-primary/30 bg-card p-4 elevation-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <GitCompareArrows className="size-4 text-primary" />Selected comparison
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Best values are marked in every row.</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Clear selection" onClick={clear}>
          <X />
        </Button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left">Metric</th>
              {candidates.map((item) => (
                <th key={item.id} className="p-2 text-left">
                  {providerLabelMap[item.provider] || String(item.provider)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Cost", (item: CandidateConfig) => `$${getCost(item)}`, (item: CandidateConfig) => getCost(item) === bestCost],
              ["Carbon", (item: CandidateConfig) => `${getCarbon(item)} kg`, (item: CandidateConfig) => getCarbon(item) === bestCarbon],
              ["Performance", (item: CandidateConfig) => `${getPerf(item)}/100`, (item: CandidateConfig) => getPerf(item) === bestPerformance],
            ].map(([label, value, isBest]) => (
              <tr key={String(label)} className="border-t">
                <th className="p-2 text-left font-medium">{String(label)}</th>
                {candidates.map((item) => {
                  const winner = (isBest as (candidate: CandidateConfig) => boolean)(item);
                  return (
                    <td key={item.id} className={`metric p-2 ${winner ? "font-semibold text-primary" : ""}`}>
                      {(value as (candidate: CandidateConfig) => string)(item)}
                      {winner && <Check className="ml-1 inline size-3" />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}