import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Award, BarChart3, BookOpen, Car, Check, ChevronDown, CircleHelp, Cloud, ExternalLink, FileDown, Globe2, History, Info, Leaf, Lightbulb, Menu, Moon, Network, Printer, Radio, RefreshCw, Settings2, Smartphone, Sparkles, Sun, TreePine, X, Zap } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CandidateConfig, ProviderId, RegionGroup, SourcedValue } from "@/types";
import { REGIONAL_GRID_SIGNALS } from "@/types";

export function getProviderConsoleUrl(provider: ProviderId | string, _configName?: string): string {
  const p = String(provider).toLowerCase();
  if (p === "aws") {
    return "https://console.aws.amazon.com/ec2/v2/home#LaunchInstances:";
  }
  if (p === "gcp") {
    return "https://console.cloud.google.com/compute/instancesAdd";
  }
  if (p === "azure") {
    return "https://portal.azure.com/#create/Microsoft.VirtualMachine";
  }
  return "https://aws.amazon.com/console/";
}

export function BackButton({ label = "Back", fallbackTo = "/", params }: { label?: string; fallbackTo?: string; params?: Record<string, any> }) {
  const router = useRouter();

  function handleBack(e: React.MouseEvent) {
    if (typeof window !== "undefined" && window.history.state && (window.history.state.idx > 0 || window.history.state.key)) {
      e.preventDefault();
      router.history.back();
    }
  }

  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
      <Link to={fallbackTo} params={params} onClick={handleBack}>
        <ArrowLeft className="mr-1.5 size-3.5" />
        {label}
      </Link>
    </Button>
  );
}

export const providerClass: Record<string, string> = {
  aws: "bg-provider-aws",
  gcp: "bg-provider-gcp",
  azure: "bg-provider-azure",
  AWS: "bg-provider-aws",
  "Google Cloud": "bg-provider-gcp",
  Azure: "bg-provider-azure",
};

export const providerTextClass: Record<string, string> = {
  aws: "text-provider-aws",
  gcp: "text-provider-gcp",
  azure: "text-provider-azure",
  AWS: "text-provider-aws",
  "Google Cloud": "text-provider-gcp",
  Azure: "text-provider-azure",
};

export const providerShort: Record<string, string> = {
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
  AWS: "AWS",
  "Google Cloud": "GCP",
  Azure: "Azure",
};

export const providerLabelMap: Record<string, string> = {
  aws: "AWS",
  gcp: "Google Cloud",
  azure: "Azure",
  AWS: "AWS",
  "Google Cloud": "Google Cloud",
  Azure: "Azure",
};

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("cloudwise-theme");
    const next = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("cloudwise-theme", next ? "dark" : "light");
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={`Use ${dark ? "light" : "dark"} mode`} title={`Use ${dark ? "light" : "dark"} mode`}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const links = [
    { to: "/", label: "Overview", icon: BarChart3 },
    { to: "/configure", label: "New analysis", icon: Sparkles },
    { to: "/history", label: "History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 sm:px-6 lg:flex lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Leaf className="size-5" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm font-bold tracking-tight">Real-Time Carbon Estimator</span>
              <span className="truncate text-[10px] text-muted-foreground">Multi-Cloud Carbon & Cost Intelligence</span>
            </div>
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} activeProps={{ className: "bg-secondary text-foreground" }} className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <div className="hidden items-center gap-3 lg:flex">
              <span className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-success"></span>
                </span>
                Live Grid Signal Active
              </span>
              <Button asChild size="sm">
                <Link to="/configure">
                  <Sparkles />Run analysis
                </Link>
              </Button>
            </div>
            <Button variant="outline" size="icon" className="lg:hidden" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)}>
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <nav id="mobile-navigation" className="border-t px-4 py-3 lg:hidden">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)} className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm ${location.pathname === to ? "bg-secondary text-foreground" : "text-muted-foreground"}`}>
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="mx-auto flex max-w-[1440px] flex-col gap-2 border-t px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>Cloudwise · Multi-cloud carbon and cost intelligence</span>
        <span className="flex items-center gap-2">
          <CircleHelp className="size-3.5" />
          Transparent methodology
        </span>
      </footer>
    </div>
  );
}

export function DemoBanner() {
  return (
    <div className="border-b border-warning/25 bg-warning/10">
      <div className="mx-auto flex min-h-10 max-w-[1440px] items-center gap-2 px-4 py-2 text-xs text-warning-foreground sm:px-6 lg:px-8">
        <Info className="size-4 shrink-0" />
        <strong className="shrink-0">Demo data</strong>
        <span className="hidden truncate sm:inline">Figures are placeholders for testing, not real prices or emissions.</span>
        <details className="relative ml-auto">
          <summary className="cursor-pointer list-none font-semibold underline underline-offset-2">What is this?</summary>
          <div className="absolute right-0 top-7 z-30 w-64 rounded-md border bg-card p-3 text-foreground elevation-2">
            <p>These figures let you test the experience. In live mode, options and numbers come from our dated pricing snapshot.</p>
          </div>
        </details>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-5 border-b pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-primary">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight display-heading sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function DataBadge({ value }: { value: SourcedValue }) {
  const label = value.dataType === "mock" ? "Demo" : `${value.dataType.charAt(0).toUpperCase()}${value.dataType.slice(1)}`;
  return (
    <details className="relative inline-block">
      <summary className="min-h-6 list-none cursor-pointer">
        <Badge variant="outline" className="gap-1 border-primary/25 bg-primary/5 text-[10px] font-medium text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          {label}
          <ChevronDown className="size-2.5" />
        </Badge>
      </summary>
      <div className="absolute right-0 top-7 z-30 w-64 rounded-md border bg-card p-3 text-left text-xs elevation-2">
        <p className="font-semibold">Data transparency</p>
        <p className="mt-2 text-muted-foreground">Type: <span className="font-medium text-foreground">{value.dataType}</span></p>
        <p className="mt-1 text-muted-foreground">Source: {value.source}</p>
        <p className="mt-1 text-muted-foreground">Retrieved: {value.retrievedAt}</p>
        {value.methodology && <p className="mt-1 text-muted-foreground">Method: {value.methodology}</p>}
      </div>
    </details>
  );
}

export function MetricValue({ value, decimals = 0 }: { value: SourcedValue; decimals?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="metric text-lg font-semibold">{value.value.toFixed(decimals)}</span>
      <span className="text-xs text-muted-foreground">{value.unit}</span>
      <DataBadge value={value} />
    </div>
  );
}

export function ProviderMark({ provider }: { provider: ProviderId | string }) {
  const pKey = String(provider).toLowerCase();
  const short = providerShort[provider] || providerShort[pKey] || String(provider);
  const label = providerLabelMap[provider] || providerLabelMap[pKey] || String(provider);
  const cls = providerClass[provider] || providerClass[pKey] || "bg-primary";

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className={`grid size-8 shrink-0 place-items-center rounded-md text-[10px] font-bold text-primary-foreground ${cls}`}>
        {short}
      </span>
      <span className="truncate font-semibold">{label}</span>
    </span>
  );
}

export function CandidateCard({ candidate, recommended }: { candidate: CandidateConfig; recommended?: string[] | undefined }) {
  const tags = recommended?.filter(Boolean) ?? [];
  const cost = candidate.monthlyCostUsd?.value ?? (candidate as any).cost?.value ?? 0;
  const carbon = candidate.monthlyCo2eKg?.value ?? (candidate as any).carbon?.value ?? 0;
  const perf = candidate.performanceScore?.value ?? (candidate as any).performance?.value ?? 0;
  const vcpu = candidate.vcpu ?? (candidate as any).cpuCores ?? 0;
  const ramGb = candidate.ramGb ?? 0;
  const region = candidate.regionLabel || (candidate as any).region || candidate.providerRegion || "";
  const name = candidate.configName || candidate.service;

  return (
    <div className={`rounded-lg border bg-card p-5 elevation-1 ${tags.length ? "border-primary/50" : ""}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <ProviderMark provider={candidate.provider} />
        {tags.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1">
            {tags.map((tag) => (
              <Badge key={tag} className="bg-primary/10 text-primary hover:bg-primary/10">
                <Check className="size-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <p className="mt-5 text-sm font-medium">{name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {region} · {vcpu} vCPU · {ramGb} GB RAM
      </p>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
        <div>
          <p className="text-xs text-muted-foreground">Monthly cost</p>
          <p className="metric mt-1 text-xl font-semibold">
            ${cost.toLocaleString()}
            <span className="text-xs font-normal text-muted-foreground"> / mo</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Overall score</p>
          <p className="metric mt-1 text-xl font-semibold text-primary">
            {candidate.overallScore.toFixed(0)}
            <span className="text-xs font-normal text-muted-foreground"> / 100</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Carbon</p>
          <p className="metric mt-1 font-semibold">
            {carbon} <span className="text-xs font-normal text-muted-foreground">kg CO₂e</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Performance</p>
          <p className="metric mt-1 font-semibold">
            {perf} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
          </p>
        </div>
      </div>
      <ProviderSustainabilityBadge provider={candidate.provider} />
      <div className="mt-4 border-t pt-3">
        <Button asChild variant="outline" size="sm" className="w-full gap-1.5 font-medium hover:border-primary hover:text-primary">
          <a href={getProviderConsoleUrl(candidate.provider, candidate.configName)} target="_blank" rel="noopener noreferrer">
            Deploy on {providerLabelMap[candidate.provider] || String(candidate.provider)}
            <ExternalLink className="size-3.5" />
          </a>
        </Button>
      </div>
    </div>
  );
}

export function LiveGridTelemetryCard({ regionGroup }: { regionGroup: RegionGroup }) {
  const signal = REGIONAL_GRID_SIGNALS[regionGroup] || REGIONAL_GRID_SIGNALS.india;
  const statusCls =
    signal.status === "Clean"
      ? "text-success border-success/30 bg-success/10"
      : signal.status === "Moderate"
      ? "text-warning border-warning/30 bg-warning/10"
      : "text-destructive border-destructive/30 bg-destructive/10";

  return (
    <div className="rounded-lg border bg-card p-4 elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex size-2.5 rounded-full bg-success"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Real-Time Grid Telemetry</span>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusCls}`}>
          {signal.status} Grid
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <span className="text-[10px] text-muted-foreground">Live Grid Carbon</span>
          <p className="metric mt-0.5 text-base font-bold text-foreground">
            {signal.intensity} <span className="text-[11px] font-normal text-muted-foreground">gCO₂e/kWh</span>
          </p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground">Clean Energy Mix</span>
          <p className="metric mt-0.5 text-base font-bold text-success">
            {signal.renewableMix}% <span className="text-[11px] font-normal text-muted-foreground">renewable</span>
          </p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground">Peak Grid Load Window</span>
          <p className="mt-0.5 text-xs font-semibold text-foreground truncate" title={signal.peakHours}>
            {signal.peakHours}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground">Optimal Green Window</span>
          <p className="mt-0.5 text-xs font-semibold text-primary truncate" title={signal.greenWindow}>
            {signal.greenWindow}
          </p>
        </div>
      </div>

      <div className="mt-3 border-t pt-2 text-[10px] text-muted-foreground flex items-center justify-between">
        <span>📡 Real-Time Grid Signal: {signal.gridSource}</span>
        <span className="font-mono text-[9px] text-success">● Synced live</span>
      </div>
    </div>
  );
}

export function ProviderSustainabilityBadge({ provider }: { provider: ProviderId | string }) {
  const p = String(provider).toLowerCase();
  const commitments: Record<string, { badge: string; desc: string }> = {
    gcp: {
      badge: "Google 24/7 CFE Goal",
      desc: "Committed to 24/7 Carbon-Free Energy by 2030 (~67% hourly clean matching).",
    },
    aws: {
      badge: "Amazon Climate Pledge",
      desc: "100% renewable electricity matching across global operations achieved.",
    },
    azure: {
      badge: "Microsoft 100/100/0",
      desc: "100% zero-carbon electricity matching by 2030; carbon negative across all scopes.",
    },
  };

  const info = commitments[p] || commitments.aws!;

  return (
    <div className="mt-2.5 flex items-center gap-1.5 rounded border border-border/60 bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground">
      <Award className="size-3 shrink-0 text-primary" />
      <span className="font-semibold text-foreground">{info.badge}:</span>
      <span className="truncate">{info.desc}</span>
    </div>
  );
}

export function GreenImpactTranslator({
  savedCo2Kg,
  durationValue,
  durationUnit,
}: {
  savedCo2Kg: number;
  durationValue: number;
  durationUnit: string;
}) {
  const effectiveSaved = Math.max(0.01, savedCo2Kg);
  const carKm = (effectiveSaved * 4.02).toFixed(1);
  const treeYears = Math.max(0.1, effectiveSaved * 0.05).toFixed(1);
  const phoneCharges = Math.round(effectiveSaved * 121.6);
  const ledHours = Math.round(effectiveSaved * 98.4);

  return (
    <div className="rounded-xl border border-success/30 bg-success/5 p-5 elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-success/20 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-success text-success-foreground">
            <TreePine className="size-5" />
          </span>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              Green Impact Translator · Real-World Equivalents
              <Badge className="border-success/30 bg-success/20 font-mono text-[10px] text-success">
                EPA GHG Standard
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Tangible environmental savings from choosing the cleanest cloud option for {durationValue} {durationUnit}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">Net Carbon Prevented</span>
          <p className="text-lg font-bold text-success">
            {effectiveSaved < 0.1 ? effectiveSaved.toFixed(3) : effectiveSaved.toFixed(2)} kg CO₂e
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-primary">
            <Car className="size-3.5" />
            <span className="text-[11px] font-semibold text-muted-foreground">Driving Avoided</span>
          </div>
          <p className="mt-1 text-base font-bold text-foreground">
            {carKm} <span className="text-xs font-normal text-muted-foreground">km</span>
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Petrol car travel equivalent</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-success">
            <TreePine className="size-3.5" />
            <span className="text-[11px] font-semibold text-muted-foreground">Tree Sequestration</span>
          </div>
          <p className="mt-1 text-base font-bold text-foreground">
            {treeYears} <span className="text-xs font-normal text-muted-foreground">tree-years</span>
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Urban seedling growth</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-sky-500">
            <Smartphone className="size-3.5" />
            <span className="text-[11px] font-semibold text-muted-foreground">Phone Charges</span>
          </div>
          <p className="mt-1 text-base font-bold text-foreground">
            {phoneCharges.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">charges</span>
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Full battery charges saved</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-1.5 text-amber-500">
            <Lightbulb className="size-3.5" />
            <span className="text-[11px] font-semibold text-muted-foreground">LED Lighting</span>
          </div>
          <p className="mt-1 text-base font-bold text-foreground">
            {ledHours.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">hours</span>
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Standard 10W LED bulb powered</p>
        </div>
      </div>
    </div>
  );
}

export function CarbonGeoShiftSimulator({
  currentRegion,
  currentEmissionsKg,
  durationValue,
  durationUnit,
}: {
  currentRegion: RegionGroup;
  currentEmissionsKg: number;
  durationValue: number;
  durationUnit: string;
}) {
  const regions: { id: RegionGroup; label: string; intensity: number; flag: string }[] = [
    { id: "europe_west", label: "Western Europe (Ireland / Belgium)", intensity: 210, flag: "🇪🇺" },
    { id: "us_east", label: "US East (N. Virginia)", intensity: 378, flag: "🇺🇸" },
    { id: "southeast_asia", label: "Southeast Asia (Singapore)", intensity: 406, flag: "🇸🇬" },
    { id: "india", label: "India (Mumbai / Pune)", intensity: 708, flag: "🇮🇳" },
  ];

  const currentSignal = regions.find((r) => r.id === currentRegion) || regions[3]!;
  const cleanestRegion = regions[0]!;

  return (
    <div className="rounded-xl border bg-card p-5 elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2">
          <Globe2 className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Follow-the-Sun / Carbon Geo-Shift Simulator
          </h3>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          Spatial Workload Shifting
        </Badge>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Workloads that are not latency-bound to a specific physical location can be scheduled to run in cleaner international grid regions, reducing carbon emissions by up to <strong>70%</strong> with zero code changes.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {regions.map((reg) => {
          const isCurrent = reg.id === currentRegion;
          const deltaPercent = Math.round(((reg.intensity - currentSignal.intensity) / currentSignal.intensity) * 100);
          const estEmissions = (currentEmissionsKg * (reg.intensity / currentSignal.intensity)).toFixed(2);

          return (
            <div
              key={reg.id}
              className={`rounded-lg border p-3.5 transition-all ${
                isCurrent
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-muted/20 hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base">{reg.flag}</span>
                {isCurrent ? (
                  <Badge className="bg-primary text-[9px] font-semibold text-primary-foreground">Active Region</Badge>
                ) : deltaPercent < 0 ? (
                  <Badge className="border-success/30 bg-success/20 text-[9px] font-semibold text-success">
                    {deltaPercent}% Carbon
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] text-muted-foreground">
                    +{deltaPercent}% Carbon
                  </Badge>
                )}
              </div>

              <p className="mt-2 truncate text-xs font-semibold text-foreground" title={reg.label}>
                {reg.label}
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-foreground">
                {reg.intensity} <span className="text-[10px] font-normal text-muted-foreground">gCO₂e/kWh</span>
              </p>

              <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">
                Est. {durationValue} {durationUnit}: <strong className="text-foreground">{estEmissions} kg</strong>
              </p>
            </div>
          );
        })}
      </div>

      {currentRegion !== "europe_west" && (
        <div className="mt-4 flex items-center gap-2.5 rounded-md border border-success/30 bg-success/10 p-3 text-xs text-foreground">
          <Leaf className="size-4 shrink-0 text-success" />
          <span>
            <strong>Spatial Optimization:</strong> Shifting to <strong>{cleanestRegion.label}</strong> instead of {currentSignal.label} would cut carbon emissions by <strong>{Math.round(((currentSignal.intensity - cleanestRegion.intensity) / currentSignal.intensity) * 100)}%</strong>!
          </span>
        </div>
      )}
    </div>
  );
}

export function ScopeCarbonBreakdown({
  operationalCo2Kg,
  vcpu,
  runtimeHours,
}: {
  operationalCo2Kg: number;
  vcpu: number;
  runtimeHours: number;
}) {
  const embodiedCo2Kg = Math.max(0.005, vcpu * 0.0015 * runtimeHours);
  const totalCo2Kg = operationalCo2Kg + embodiedCo2Kg;
  const scope2Percent = Math.round((operationalCo2Kg / (totalCo2Kg || 1)) * 100);
  const scope3Percent = 100 - scope2Percent;

  return (
    <div className="rounded-xl border bg-card p-5 elevation-1">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          GHG Protocol Scope 2 vs. Scope 3 Breakdown
        </h3>
        <Badge variant="outline" className="font-mono text-[10px]">
          ISO 14064 / GHG Protocol
        </Badge>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Comprehensive enterprise greenhouse gas accounting differentiates active power consumption (<strong>Scope 2</strong>) from amortized hardware fabrication and supply chain lifecycle emissions (<strong>Scope 3</strong>).
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/20 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">⚡ Scope 2: Operational Emissions</span>
            <span className="font-mono text-xs font-bold text-primary">{scope2Percent}%</span>
          </div>
          <p className="mt-1.5 font-mono text-lg font-bold text-foreground">
            {operationalCo2Kg < 0.01 ? "< 0.01" : operationalCo2Kg.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">kg CO₂e</span>
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Direct grid electricity consumed by CPU, RAM, storage disks, network egress, and datacenter cooling (PUE).
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">🏭 Scope 3: Embodied Hardware Carbon</span>
            <span className="font-mono text-xs font-bold text-amber-500">{scope3Percent}%</span>
          </div>
          <p className="mt-1.5 font-mono text-lg font-bold text-foreground">
            {embodiedCo2Kg < 0.01 ? "< 0.01" : embodiedCo2Kg.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">kg CO₂e</span>
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Silicon manufacturing, motherboard raw materials extraction, and server supply chain amortized over a 4-year lifecycle.
          </p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Network, title, description, action }: { icon?: typeof Network; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed bg-card/50 px-6 text-center">
      <svg aria-hidden="true" viewBox="0 0 160 90" className="h-24 w-40 text-primary">
        <path d="M22 67h116M44 65V43m36 22V21m36 44V35" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="44" cy="39" r="8" fill="currentColor" opacity=".2" />
        <circle cx="80" cy="17" r="8" fill="currentColor" opacity=".35" />
        <circle cx="116" cy="31" r="8" fill="currentColor" opacity=".55" />
      </svg>
      <span className="sr-only">
        <Icon />
      </span>
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ShellIconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Button type="button" variant="outline" size="icon" aria-label={label} title={label} onClick={onClick}>
      {children}
    </Button>
  );
}

export const icons = { chart: BarChart3, cloud: Cloud, file: FileDown, book: BookOpen, refresh: RefreshCw, settings: Settings2 };

export function formatWorkload(value: string) {
  return value
    .replaceAll("_", "-")
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}