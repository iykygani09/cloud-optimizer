import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, createFileRoute } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronUp, Clock, Cpu, Database, Gauge, HardDrive, Info, Layers, Leaf, Lock, MapPin, Minus, Plus, Radio, Server, Settings2, ShieldCheck, Sparkles, Timer, Wifi, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/api";
import { PageHeader, BackButton, LiveGridTelemetryCard } from "@/components/app-ui";
import { REAL_WORLD_WORKLOADS, type Priorities, type RegionGroup, type WorkloadInput, type WorkloadType } from "@/types";

export const Route = createFileRoute("/configure")({
  head: () => ({
    meta: [
      { title: "Configure workload · Real-Time Carbon Footprint Estimator" },
      { name: "description", content: "Predict real-time carbon emissions and costs across AWS, Google Cloud, and Azure." },
      { property: "og:title", content: "Configure workload · Real-Time Carbon Footprint Estimator" },
      { property: "og:description", content: "Predict real-time carbon emissions and costs across AWS, Google Cloud, and Azure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfigurePage,
});

const schema = z.object({
  workloadType: z.enum(["web_app", "api", "data_processing", "machine_learning", "other"]),
  cpuCores: z.coerce.number().min(1).max(64),
  ramGb: z.coerce.number().min(1).max(512),
  storageGb: z.coerce.number().min(10).max(10000),
  runtimeHoursPerDay: z.coerce.number().min(1).max(24),
  dataTransferGbPerDay: z.coerce.number().min(0).max(10000),
  requestsPerDay: z.coerce.number().min(0).max(1000000000),
  regionGroup: z.enum(["india", "us_east", "europe_west", "southeast_asia"]),
  performanceRequirement: z.enum(["low", "standard", "high", "critical"]),
  durationValue: z.coerce.number().min(1).max(1000),
  durationUnit: z.enum(["hours", "days", "weeks"]),
  urgency: z.enum(["urgent", "flexible"]),
  costWeight: z.coerce.number().min(0).max(100),
  performanceWeight: z.coerce.number().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;
type NumberKey = "cpuCores" | "ramGb" | "storageGb" | "runtimeHoursPerDay" | "dataTransferGbPerDay" | "requestsPerDay";

const resourceFields: { name: NumberKey; label: string; min: number; max: number; unit: string; help: string; icon: typeof Cpu }[] = [
  { name: "cpuCores", label: "CPU cores", min: 1, max: 64, unit: "vCPU", help: "Typical workload: 2–8 vCPU", icon: Cpu },
  { name: "ramGb", label: "Memory", min: 1, max: 512, unit: "GB", help: "Typical workload: 4–32 GB", icon: Server },
  { name: "storageGb", label: "Storage", min: 10, max: 10000, unit: "GB", help: "Persistent SSD disk, 10–10,000 GB", icon: HardDrive },
];

const usageFields: typeof resourceFields = [
  { name: "runtimeHoursPerDay", label: "Daily active hours", min: 1, max: 24, unit: "hours", help: "From 1 to 24 hours per day", icon: Timer },
  { name: "dataTransferGbPerDay", label: "Data egress each day", min: 0, max: 10000, unit: "GB", help: "Outbound transfer, 0–10,000 GB", icon: Wifi },
  { name: "requestsPerDay", label: "Requests each day", min: 0, max: 1000000000, unit: "req", help: "API request volume per day", icon: Database },
];

const regionLabels: Record<string, string> = {
  india: "India (Mumbai / Pune)",
  us_east: "US East (N. Virginia)",
  europe_west: "Western Europe (Ireland / Belgium / Netherlands)",
  southeast_asia: "Southeast Asia (Singapore)",
};

function ConfigurePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      workloadType: "web_app",
      cpuCores: 4,
      ramGb: 16,
      storageGb: 100,
      runtimeHoursPerDay: 8,
      dataTransferGbPerDay: 20,
      requestsPerDay: 0,
      regionGroup: "india",
      performanceRequirement: "standard",
      durationValue: 8,
      durationUnit: "hours",
      urgency: "urgent",
      costWeight: 50,
      performanceWeight: 50,
    },
  });

  const values = watch();

  useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }
    const interval = window.setInterval(() => {
      setElapsedSeconds((sec) => sec + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [loading]);

  function handleWorkloadSelect(item: (typeof REAL_WORLD_WORKLOADS)[0]) {
    setValue("workloadType", item.type);
    setValue("cpuCores", item.recommendedCores);
    setValue("ramGb", item.recommendedRam);
  }

  async function submit(formValues: FormValues) {
    setLoading(true);
    setErrorMsg(null);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out after 15 seconds. Please try again.")), 15000)
    );

    try {
      const input: WorkloadInput = {
        workloadType: formValues.workloadType,
        cpuCores: formValues.cpuCores,
        ramGb: formValues.ramGb,
        storageGb: formValues.storageGb,
        runtimeHoursPerDay: formValues.durationUnit === "hours" ? Math.min(24, Math.max(1, Number(formValues.durationValue))) : formValues.runtimeHoursPerDay,
        dataTransferGbPerDay: formValues.dataTransferGbPerDay,
        requestsPerDay: formValues.requestsPerDay,
        regionGroup: formValues.regionGroup,
        performanceRequirement: formValues.performanceRequirement,
        durationValue: Number(formValues.durationValue),
        durationUnit: formValues.durationUnit,
        urgency: formValues.urgency,
      };

      // Carbon priority is LOCKED at 100% (non-negotiable green baseline)
      // We scale the remaining 40% between cost & performance preferences
      const costShare = (formValues.costWeight / (formValues.costWeight + formValues.performanceWeight || 1)) * 40;
      const perfShare = 40 - costShare;
      const priorities: Priorities = {
        carbon: 60, // Dominant carbon minimization weight
        cost: Math.round(costShare),
        performance: Math.round(perfShare),
      };

      const result = await Promise.race([
        apiClient.analyzeWorkload(input, priorities),
        timeoutPromise,
      ]);

      // Cache exact duration and urgency in localStorage so results page has the exact selected period even if remote backend schema stripped it
      try {
        const durationMeta = {
          durationValue: Number(formValues.durationValue),
          durationUnit: formValues.durationUnit,
          urgency: formValues.urgency,
        };
        localStorage.setItem(`workload_duration_${result.id}`, JSON.stringify(durationMeta));
        localStorage.setItem("latest_workload_duration", JSON.stringify(durationMeta));
        localStorage.setItem("cloudwise_recent_analysis", JSON.stringify(result));
      } catch (e) {
        console.warn("Could not cache workload duration", e);
      }

      await navigate({ to: "/results/$id", params: { id: result.id } });
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit analysis. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <BackButton label="Back" fallbackTo="/" />
        <span className="text-border">/</span>
        <Link to="/" className="hover:text-foreground">Overview</Link>
        <span className="text-border">/</span>
        <span className="font-medium text-foreground">Real-Time Estimator</span>
      </div>

      <PageHeader
        eyebrow="Real-Time Carbon Footprint Estimator · Cloud Workload Analysis"
        title="Configure your workload & required period"
        description="Predict real-time carbon emissions and costs across AWS, Google Cloud, and Azure. With carbon optimization locked at 100%, set your execution timeframe and urgency."
      />

      {/* Real-time Grid Signal Bar */}
      <div className="mt-6">
        <LiveGridTelemetryCard regionGroup={values.regionGroup as RegionGroup} />
      </div>

      <form onSubmit={handleSubmit(submit)} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          {/* Real-World Workload Category Selection */}
          <FormSection icon={Layers} title="Real-World Workload Category" description="Select the real-world workload profile you want to run:">
            <div className="grid gap-3 sm:grid-cols-1">
              {REAL_WORLD_WORKLOADS.map((item) => {
                const isSelected = values.workloadType === item.type;
                return (
                  <label
                    key={item.title}
                    onClick={() => handleWorkloadSelect(item)}
                    className={`cursor-pointer block rounded-lg border p-4 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="radio"
                      value={item.type}
                      {...register("workloadType")}
                      className="peer sr-only"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${isSelected ? "bg-primary" : "bg-muted-foreground/40"}`} />
                          <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
                        <p className="mt-2 text-[11px] text-primary font-medium">
                          💡 Real-world examples: <span className="text-foreground/80 font-normal">{item.example}</span>
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 font-mono">
                        {item.recommendedCores} vCPU · {item.recommendedRam} GB
                      </Badge>
                    </div>
                  </label>
                );
              })}
            </div>
          </FormSection>

          {/* Execution Timeframe & Duration */}
          <FormSection icon={Clock} title="Execution Timeframe & Duration" description="How long do you need this workload to run? (Hours, Days, or Weeks)">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="durationValue">Duration count</Label>
                <div className="relative mt-2">
                  <Input
                    id="durationValue"
                    type="number"
                    min={1}
                    max={1000}
                    {...register("durationValue")}
                    className="pl-3 pr-12 font-semibold"
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                    {values.durationUnit}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Number of required {values.durationUnit}</p>
              </div>

              <div>
                <Label htmlFor="durationUnit">Timeframe unit</Label>
                <select
                  id="durationUnit"
                  {...register("durationUnit")}
                  className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                >
                  <option value="hours">Hours (Short-term batch / Urgent test)</option>
                  <option value="days">Days (Multi-day workload / Training)</option>
                  <option value="weeks">Weeks (Extended production / Campaign)</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">Select whether duration is in hours, days, or weeks</p>
              </div>
            </div>

            {/* Quick Time Presets */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center mr-1">Quick presets:</span>
              {[
                { label: "4 Hours", value: 4, unit: "hours" },
                { label: "12 Hours", value: 12, unit: "hours" },
                { label: "24 Hours (1 Day)", value: 24, unit: "hours" },
                { label: "3 Days", value: 3, unit: "days" },
                { label: "1 Week", value: 1, unit: "weeks" },
                { label: "4 Weeks (1 Month)", value: 4, unit: "weeks" },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setValue("durationValue", preset.value);
                    setValue("durationUnit", preset.unit as any);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </FormSection>

          {/* Urgency & Carbon-Aware Scheduling */}
          <FormSection icon={Zap} title="Workload Urgency & Carbon-Aware Scheduling" description="Tell us if this workload must run immediately or can wait for a green energy window:">
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer block rounded-lg border p-4 transition-all ${
                  values.urgency === "urgent"
                    ? "border-warning bg-warning/5 ring-1 ring-warning"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  value="urgent"
                  {...register("urgency")}
                  className="peer sr-only"
                />
                <div className="flex items-center gap-2">
                  <span className="text-warning font-bold">⚡ Urgent (Run Now)</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Time-critical task. Must launch immediately regardless of current grid carbon intensity.
                </p>
              </label>

              <label
                className={`cursor-pointer block rounded-lg border p-4 transition-all ${
                  values.urgency === "flexible"
                    ? "border-success bg-success/5 ring-1 ring-success"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  value="flexible"
                  {...register("urgency")}
                  className="peer sr-only"
                />
                <div className="flex items-center gap-2">
                  <span className="text-success font-bold">🌿 Flexible (Carbon-Aware)</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Can wait for green energy windows (solar/wind peaks) or shift to cleaner regions to cut CO₂e emissions.
                </p>
              </label>
            </div>
          </FormSection>

          {/* Compute Resources */}
          <FormSection icon={Cpu} title="Compute Resources" description="Customize the required CPU, RAM, and persistent storage capacity:">
            <FieldGrid fields={resourceFields} register={register} errors={errors} getValues={getValues} setValue={setValue} />
          </FormSection>

          {/* Optional Advanced Parameters */}
          <details className="group rounded-xl border border-dashed border-border bg-card/60 p-4 transition-all">
            <summary className="cursor-pointer font-semibold text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2 text-foreground font-medium">
                <Settings2 className="size-4 text-primary" />
                Advanced Network Egress & Request Volume (Optional)
              </span>
              <span className="text-[11px] text-primary group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <p className="mt-2 text-xs text-muted-foreground">
              Automatically pre-filled by your chosen workload preset. Expand to customize outbound data egress or API requests:
            </p>
            <div className="mt-4">
              <FieldGrid fields={usageFields} register={register} errors={errors} getValues={getValues} setValue={setValue} />
            </div>
          </details>

          {/* Location and Target Performance */}
          <FormSection icon={MapPin} title="Target Location & Performance" description="Choose preferred region group and hardware performance rating:">
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField label="Target Region Group" help="Determines real-time grid emissions factor and regional pricing">
                <select id="regionGroup" {...register("regionGroup")} className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="india">India (Mumbai / Pune - 708 gCO₂e/kWh)</option>
                  <option value="us_east">US East (N. Virginia - 378 gCO₂e/kWh)</option>
                  <option value="europe_west">Western Europe (Ireland / Belgium - 210 gCO₂e/kWh)</option>
                  <option value="southeast_asia">Southeast Asia (Singapore - 406 gCO₂e/kWh)</option>
                </select>
              </SelectField>

              <SelectField label="Performance Benchmark Headroom" help="Higher requirements favor faster CPU clock speeds and SPEC benchmarks">
                <select id="performanceRequirement" {...register("performanceRequirement")} className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="low">Standard / Economy</option>
                  <option value="standard">Standard Production</option>
                  <option value="high">High Performance</option>
                  <option value="critical">Critical Compute-Bound</option>
                </select>
              </SelectField>
            </div>
          </FormSection>
        </div>

        {/* Right Sticky Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-lg border bg-card p-5 elevation-2 sm:p-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-foreground">Analysis Configuration</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Real-time parameters summary</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/30 text-[11px] gap-1">
                <Sparkles className="size-3" />
                Live Engine
              </Badge>
            </div>

            {/* Locked Carbon-First Priority Foundation */}
            <div className="mt-5 rounded-lg border border-success/40 bg-success/10 p-4">
              <div className="flex items-center gap-2 text-success font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="size-4" />
                <span>Carbon Priority: 100% Locked</span>
              </div>
              <p className="mt-1.5 text-xs text-foreground/90 font-medium">
                Core Engine Baseline (Non-Negotiable)
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                As a <strong>Carbon Footprint Estimator</strong>, this engine strictly maximizes green energy efficiency and carbon minimization on every calculation.
              </p>
            </div>

            {/* Secondary Trade-off: Cost vs Performance Balance */}
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Cost Sensitivity</span>
                <span className="metric text-xs font-bold text-cost">{values.costWeight}%</span>
              </div>
              <input
                aria-label="Cost priority"
                type="range"
                min="0"
                max="100"
                step="5"
                {...register("costWeight")}
                className="h-2 w-full accent-cost cursor-pointer rounded-lg bg-muted"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Flexible Budget</span>
                <span>Strict Cost Saving</span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold">Performance Priority</span>
                <span className="metric text-xs font-bold text-performance">{values.performanceWeight}%</span>
              </div>
              <input
                aria-label="Performance priority"
                type="range"
                min="0"
                max="100"
                step="5"
                {...register("performanceWeight")}
                className="h-2 w-full accent-performance cursor-pointer rounded-lg bg-muted"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Standard Speeds</span>
                <span>Max Compute Headroom</span>
              </div>
            </div>

            {/* Timeframe & Urgency Summary */}
            <dl className="mt-6 grid grid-cols-2 gap-3 rounded-md bg-muted/60 p-3.5 text-xs">
              <div>
                <dt className="text-[10px] text-muted-foreground">Requested Period</dt>
                <dd className="metric mt-0.5 font-bold text-foreground">
                  {values.durationValue} {values.durationUnit}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Urgency Mode</dt>
                <dd className={`mt-0.5 font-bold capitalize ${values.urgency === "urgent" ? "text-warning" : "text-success"}`}>
                  {values.urgency === "urgent" ? "⚡ Urgent (Now)" : "🌿 Flexible"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Resources</dt>
                <dd className="metric mt-0.5 font-semibold text-foreground">
                  {values.cpuCores} vCPU · {values.ramGb} GB
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Target Region</dt>
                <dd className="mt-0.5 font-semibold text-foreground truncate" title={regionLabels[values.regionGroup]}>
                  {regionLabels[values.regionGroup]?.split(" ")[0]}
                </dd>
              </div>
            </dl>

            {loading ? (
              <ProgressSteps elapsed={elapsedSeconds} />
            ) : (
              <>
                <Button type="submit" disabled={Object.keys(errors).length > 0} className="mt-6 w-full gap-2 font-semibold">
                  <Sparkles className="size-4" />
                  Predict Real-Time Carbon & Cost
                </Button>
                {errorMsg && <p className="mt-2 text-center text-xs text-destructive">{errorMsg}</p>}
              </>
            )}

            <p className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Evaluates live instance catalog across AWS, GCP, and Azure with real-time carbon telemetry.
            </p>
          </section>

          <Link to="/" className="mt-3 flex min-h-11 items-center justify-center text-xs text-muted-foreground hover:text-foreground">
            Back to overview
          </Link>
        </aside>
      </form>
    </div>
  );
}

function FormSection({ icon: Icon, title, description, children }: { icon: typeof Cpu; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5 elevation-1 sm:p-7">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-md bg-secondary text-primary">
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function FieldGrid({ fields, register, errors, getValues, setValue }: { fields: typeof resourceFields; register: ReturnType<typeof useForm<FormValues>>["register"]; errors: ReturnType<typeof useForm<FormValues>>["formState"]["errors"]; getValues: ReturnType<typeof useForm<FormValues>>["getValues"]; setValue: ReturnType<typeof useForm<FormValues>>["setValue"] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {fields.map((field) => {
        const Icon = field.icon;
        const invalid = errors[field.name];
        return (
          <div key={field.name}>
            <Label htmlFor={field.name} className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" />
              {field.label}
            </Label>
            <div className="relative mt-2">
              <Input id={field.name} type="number" min={field.min} max={field.max} {...register(field.name)} className="pl-11 pr-20" aria-invalid={Boolean(invalid)} />
              <Button type="button" variant="ghost" size="icon" className="absolute left-0 top-0" aria-label={`Decrease ${field.label}`} onClick={() => setValue(field.name, Math.max(field.min, Number(getValues(field.name)) - 1))}>
                <Minus />
              </Button>
              <div className="absolute right-0 top-0 flex h-11 items-center">
                <span className="px-2 text-[11px] text-muted-foreground">{field.unit}</span>
                <span className="grid h-full w-8 border-l">
                  <button type="button" className="grid place-items-center" aria-label={`Increase ${field.label}`} onClick={() => setValue(field.name, Math.min(field.max, Number(getValues(field.name)) + 1))}>
                    <ChevronUp className="size-3" />
                  </button>
                  <button type="button" className="grid place-items-center border-t" aria-label={`Decrease ${field.label}`} onClick={() => setValue(field.name, Math.max(field.min, Number(getValues(field.name)) - 1))}>
                    <ChevronDown className="size-3" />
                  </button>
                </span>
              </div>
            </div>
            <p className={`mt-1.5 text-xs ${invalid ? "text-destructive" : "text-muted-foreground"}`}>
              {invalid ? `Enter ${field.min.toLocaleString()} to ${field.max.toLocaleString()} ${field.unit}.` : field.help}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function SelectField({ label, help, children }: { label: string; help: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      <p className="mt-1.5 text-xs text-muted-foreground">{help}</p>
    </div>
  );
}

function ProgressSteps({ elapsed }: { elapsed: number }) {
  const steps = [
    "Reading real-time regional grid carbon intensity...",
    "Evaluating 31 cloud instance specs (AWS, GCP, Azure)...",
    "Calculating duration-adjusted costs & emissions...",
    "Locking carbon-first ranking & generating recommendations...",
  ];
  const stage = Math.min(Math.floor(elapsed / 1.5), 3);

  return (
    <div className="mt-6 rounded-md border bg-muted/50 p-4" role="status" aria-live="polite">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-success"></span>
          </span>
          Predicting Real-Time Carbon...
        </p>
        <span className="metric text-xs text-muted-foreground">{elapsed}s</span>
      </div>
      <div className="mt-4 space-y-3">
        {steps.map((label, index) => (
          <div key={label} className={`flex items-center gap-3 text-xs ${index <= stage ? "text-foreground" : "text-muted-foreground"}`}>
            <span className={`grid size-5 place-items-center rounded-full border ${index < stage ? "bg-primary text-primary-foreground" : index === stage ? "border-primary" : ""}`}>
              {index < stage ? <Check className="size-3" /> : index === stage ? <span className="size-2 animate-pulse rounded-full bg-primary" /> : index + 1}
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
