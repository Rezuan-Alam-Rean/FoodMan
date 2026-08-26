"use client";

import { useEffect, useState, useCallback } from "react";

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased font-sans">
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Foodman
              </h1>
              <p className="text-xs text-zinc-400">Food ordering and delivery platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh((prev) => !prev)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                autoRefresh
                  ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                  : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-zinc-200"
              }`}
            >
              {autoRefresh ? "Auto-refresh: On (5s)" : "Auto-refresh: Paused"}
            </button>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div
          className={`p-6 rounded-2xl border transition-all ${
            error
              ? "bg-rose-950/20 border-rose-800/40"
              : isHealthy
              ? "bg-emerald-950/20 border-emerald-800/40"
              : isDegraded
              ? "bg-amber-950/20 border-amber-800/40"
              : "bg-zinc-900/40 border-zinc-800"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <span
                className={`mt-1 sm:mt-0 h-3.5 w-3.5 rounded-full ${
                  error
                    ? "bg-rose-500"
                    : isHealthy
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  {error
                    ? "Backend Server Unreachable"
                    : isHealthy
                    ? "All Systems Operational"
                    : "System Running in Degraded State"}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {error
                    ? error
                    : isHealthy
                    ? "Database ping succeeded and services are healthy."
                    : "Server is responding but database connection has issues."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400">
              {lastUpdated && (
                <span>
                  Last checked: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              {health?.uptime && (
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 font-mono text-zinc-300">
                  uptime: {health.uptime}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    MongoDB Database
                  </h3>
                  <p className="text-xs text-zinc-400">Database ping & status</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  health?.services.database.status === "healthy"
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                    : "bg-rose-950/40 text-rose-300 border-rose-800/60"
                }`}
              >
                {health?.services.database.status || "offline"}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Connection State</span>
                <span className="font-mono text-zinc-200">
                  {health?.services.database.state || "disconnected"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Ping Latency</span>
                <span className="font-mono font-medium text-emerald-400">
                  {health?.services.database.latencyMs !== null &&
                  health?.services.database.latencyMs !== undefined
                    ? `${health.services.database.latencyMs} ms`
                    : "n/a"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Connected Host</span>
                <span className="font-mono text-zinc-300 truncate max-w-[200px]" title={health?.services.database.host}>
                  {health?.services.database.host || "n/a"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-zinc-400">Database Name</span>
                <span className="font-mono text-zinc-300">
                  {health?.services.database.name || "n/a"}
                </span>
              </div>

              {health?.services.database.error && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300">
                  {health.services.database.error}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">
                    Express Server
                  </h3>
                  <p className="text-xs text-zinc-400">Node runtime & memory</p>
                </div>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  health?.services.server.status === "healthy"
                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
                    : "bg-rose-950/40 text-rose-300 border-rose-800/60"
                }`}
              >
                {health?.services.server.status || "offline"}
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Environment</span>
                <span className="font-mono text-zinc-200">
                  {health?.environment || "n/a"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Node Version</span>
                <span className="font-mono text-zinc-300">
                  {health?.services.server.nodeVersion || "n/a"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/60">
                <span className="text-zinc-400">Heap Used / Total</span>
                <span className="font-mono text-zinc-300">
                  {health?.services.server.memoryUsage
                    ? `${health.services.server.memoryUsage.heapUsed} / ${health.services.server.memoryUsage.heapTotal}`
                    : "n/a"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5">
                <span className="text-zinc-400">RSS Memory</span>
                <span className="font-mono text-zinc-300">
                  {health?.services.server.memoryUsage?.rss || "n/a"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Health Endpoint JSON Response
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              GET /api/v1/health
            </span>
          </div>

          <pre className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 font-mono text-xs text-emerald-400/90 overflow-x-auto">
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
