"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  Database,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Code2,
  Clock,
  Radio,
} from "lucide-react";

interface ServiceMemory {
  rss: string;
  heapUsed: string;
  heapTotal: string;
}

interface ServerService {
  status: string;
  nodeVersion: string;
  memoryUsage: ServiceMemory;
}

interface DatabaseService {
  status: string;
  connected: boolean;
  state: string;
  latencyMs: number | null;
  host?: string;
  name?: string;
  error?: string;
}

interface HealthData {
  status: "OK" | "DEGRADED" | string;
  timestamp: string;
  uptime: string;
  environment: string;
  services: {
    server: ServerService;
    database: DatabaseService;
  };
}

interface HealthResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: HealthData;
}

export default function Home() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // fetch health endpoint
  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const response = await fetch(`${apiUrl}/health`, {
        cache: "no-store",
      });

      const payload: HealthResponse = await response.json();

      if (payload.data) {
        setHealth(payload.data);
        setLastUpdated(new Date());
      } else {
        setError(payload.message || "Failed to retrieve health metrics");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to reach the backend server";
      setError(message);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load and polling effect
  useEffect(() => {
    fetchHealth();

    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchHealth, autoRefresh]);

  const isHealthy = health?.status === "OK";
  const isDegraded = health?.status === "DEGRADED";

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-soft border border-brand/20 flex items-center justify-center shadow-sm text-brand">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-display font-bold tracking-tight text-foreground">
                Foodman
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                autoRefresh
                  ? "bg-success-soft text-success border-success/30"
                  : "bg-surface-elevated text-foreground-muted border-border hover:text-foreground"
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? "animate-pulse" : ""}`} />
              {autoRefresh ? "(5s)" : "Paused"}
            </button>

            <button
              type="button"
              onClick={fetchHealth}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-brand hover:bg-brand-hover text-foreground-on-brand transition-all shadow-sm hover:shadow-brand active:bg-brand-active disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div
          className={`p-6 rounded-2xl border transition-all ${
            error
              ? "bg-danger-soft border-danger/30"
              : isHealthy
              ? "bg-success-soft border-success/30"
              : isDegraded
              ? "bg-warning-soft border-warning/30"
              : "bg-surface-elevated border-border"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="mt-0.5 sm:mt-0">
                {error ? (
                  <XCircle className="w-5 h-5 text-danger" />
                ) : isHealthy ? (
                  <CheckCircle2 className="w-5 h-5 text-success animate-pulse" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-warning" />
                )}
              </div>

              <div>
                <h2 className="text-lg font-display font-semibold text-foreground">
                  {error
                    ? "Backend Server Unreachable"
                    : isHealthy
                    ? "All Systems Operational"
                    : "System Running in Degraded State"}
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {error
                    ? error
                    : isHealthy
                    ? "Database ping succeeded and services are healthy."
                    : "Server is responding but database connection has issues."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-foreground-muted font-sans">
              {mounted && lastUpdated && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              {health?.uptime && (
                <span className="px-2.5 py-1 rounded-md bg-surface border border-border font-mono text-foreground font-medium">
                  uptime: {health.uptime}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent-soft border border-accent/20 text-accent">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-foreground">
                    MongoDB Database
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Database connection & ping latency
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  health?.services.database.status === "healthy"
                    ? "bg-success-soft text-success border-success/30"
                    : "bg-danger-soft text-danger border-danger/30"
                }`}
              >
                {health?.services.database.status || "offline"}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                <span className="text-foreground-muted">Connection State</span>
                <span className="font-mono font-medium text-foreground">
                  {health?.services.database.state || "disconnected"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                <span className="text-foreground-muted">Ping Latency</span>
                <span className="font-mono font-semibold text-success">
                  {health?.services.database.latencyMs !== null &&
                  health?.services.database.latencyMs !== undefined
                    ? `${health.services.database.latencyMs} ms`
                    : "n/a"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                <span className="text-foreground-muted">Connected Host</span>
                <span
                  className="font-mono text-foreground truncate max-w-[220px]"
                  title={health?.services.database.host}
                >
                  {health?.services.database.host || "n/a"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-foreground-muted">Database Name</span>
                <span className="font-mono font-medium text-foreground">
                  {health?.services.database.name || "n/a"}
                </span>
              </div>

              {health?.services.database.error && (
                <div className="p-3 rounded-xl bg-danger-soft border border-danger/30 text-xs text-danger">
                  {health.services.database.error}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-info-soft border border-info/20 text-info">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-foreground">
                    Express Server
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Node.js runtime environment & memory
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  health?.services.server.status === "healthy"
                    ? "bg-success-soft text-success border-success/30"
                    : "bg-danger-soft text-danger border-danger/30"
                }`}
              >
                {health?.services.server.status || "offline"}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                <span className="text-foreground-muted">Environment</span>
                <span className="font-mono font-medium text-foreground">
                  {health?.environment || "n/a"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                <span className="text-foreground-muted">Node Version</span>
                <span className="font-mono font-medium text-foreground">
                  {health?.services.server.nodeVersion || "n/a"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-b border-border">
                <span className="text-foreground-muted">Heap Used / Total</span>
                <span className="font-mono font-medium text-foreground">
                  {health?.services.server.memoryUsage
                    ? `${health.services.server.memoryUsage.heapUsed} / ${health.services.server.memoryUsage.heapTotal}`
                    : "n/a"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-foreground-muted">RSS Memory</span>
                <span className="font-mono font-medium text-foreground">
                  {health?.services.server.memoryUsage?.rss || "n/a"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-foreground-subtle" />
              <h3 className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">
                Health Endpoint JSON Response
              </h3>
            </div>
            <span className="text-xs text-foreground-muted font-mono bg-background-subtle px-2 py-0.5 rounded border border-border">
              GET /api/v1/health
            </span>
          </div>

          <pre className="p-4 rounded-xl bg-background-subtle border border-border font-mono text-xs text-foreground overflow-x-auto leading-relaxed">
            {health
              ? JSON.stringify(health, null, 2)
              : error
              ? JSON.stringify({ error, status: "OFFLINE" }, null, 2)
              : "// loading health metrics..."}
          </pre>
        </div>
      </main>
    </div>
  );
}
