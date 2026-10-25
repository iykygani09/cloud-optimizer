import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AppShell } from "../components/app-ui";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="metric text-sm text-primary">Page not found</p>
        <h1 className="mt-3 text-4xl font-semibold display-heading">This view is unavailable</h1>
        <p className="mt-3 text-muted-foreground">The analysis or page you requested doesn’t exist.</p>
        <Link to="/" className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline">Return to overview</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Root Boundary Error:", error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold display-heading">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">Try refreshing this view or return to the overview.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Try again
          </button>
          <Link to="/" className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-semibold">Overview</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Real-Time Carbon Footprint Estimator for Cloud Workloads" },
      { name: "description", content: "Predict real-time carbon emissions, schedule green energy windows, and optimize cloud costs across AWS, Google Cloud, and Azure." },
      { name: "author", content: "Real-Time Carbon Estimator" },
      { property: "og:title", content: "Real-Time Carbon Footprint Estimator for Cloud Workloads" },
      { property: "og:description", content: "Predict real-time carbon emissions, schedule green energy windows, and optimize cloud costs across AWS, Google Cloud, and Azure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <div className="page-fade">
          <Outlet />
        </div>
      </AppShell>
      <Toaster position="bottom-center" />
    </QueryClientProvider>
  );
}
