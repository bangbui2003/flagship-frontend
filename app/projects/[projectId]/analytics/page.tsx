"use client";

import { use, useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import useSWR from "swr";
import {
  BarChart3,
  TrendingUp,
  Users,
  Flag,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/use-toast";
import { api, fetcher, type Flag as FlagType, type Environment, type Project } from "@/lib/api";

interface OverviewData {
  totalEvaluations: number;
  uniqueUsers: number;
  totalFlags: number;
  activeFlags: number;
  period: {
    start: string;
    end: string;
  };
}

interface FlagStats {
  flagId: string;
  flagKey: string;
  flagName: string;
  totalEvaluations: number;
  uniqueUsers: number;
  variations: Array<{
    variationId: string;
    variationKey: string;
    count: number;
    percentage: number;
  }>;
}

interface TimeSeriesData {
  timestamp: string;
  evaluations: number;
  uniqueUsers: number;
}

interface TopUser {
  userKey: string;
  evaluations: number;
}

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [timeRange, setTimeRange] = useState("7d");
  const [isExporting, setIsExporting] = useState(false);

  const selectedEnvId = searchParams.get("env") ?? "";

  const setSelectedEnvId = (envId: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (envId) {
      p.set("env", envId);
    } else {
      p.delete("env");
    }
    router.replace(`${pathname}?${p.toString()}`);
  };

  const { data: project } = useSWR<Project>(
    `/v1/projects/${projectId}`,
    fetcher
  );
  const { data: environments } = useSWR<Environment[]>(
    `/v1/projects/${projectId}/environments`,
    fetcher
  );

  const { data: flags } = useSWR<FlagType[]>(
    `/v1/projects/${projectId}/flags`,
    fetcher
  );

  // Set default environment via useEffect to avoid setState-during-render
  useEffect(() => {
    if (environments?.length && !selectedEnvId) {
      setSelectedEnvId(environments[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environments]);

  // Calculate date range based on timeRange
  const dateParams = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case "24h":
        start.setHours(start.getHours() - 24);
        break;
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
    }

    const params = new URLSearchParams({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });

    if (selectedEnvId) {
      params.set("environmentId", selectedEnvId);
    }

    return params.toString();
  }, [timeRange, selectedEnvId]);

  // Fetch real analytics data
  const { data: overview, isLoading: overviewLoading } = useSWR<OverviewData>(
    `/v1/projects/${projectId}/analytics/overview?${dateParams}`,
    fetcher
  );

  const { data: flagStats, isLoading: flagStatsLoading } = useSWR<FlagStats[]>(
    `/v1/projects/${projectId}/analytics/flags?${dateParams}`,
    fetcher
  );

  const granularity = timeRange === "24h" ? "hour" : "day";
  const { data: timeSeries, isLoading: timeSeriesLoading } = useSWR<TimeSeriesData[]>(
    `/v1/projects/${projectId}/analytics/timeseries?${dateParams}&granularity=${granularity}`,
    fetcher
  );

  const { data: topUsers } = useSWR<TopUser[]>(
    `/v1/projects/${projectId}/analytics/users?${dateParams}&limit=5`,
    fetcher
  );

  const isLoading = overviewLoading || flagStatsLoading || timeSeriesLoading;

  // Export analytics data as CSV
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const end = new Date();
      const start = new Date();
      
      switch (timeRange) {
        case "24h":
          start.setHours(start.getHours() - 24);
          break;
        case "7d":
          start.setDate(start.getDate() - 7);
          break;
        case "30d":
          start.setDate(start.getDate() - 30);
          break;
        case "90d":
          start.setDate(start.getDate() - 90);
          break;
      }

      const params: Record<string, string> = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };

      if (selectedEnvId) {
        params.environmentId = selectedEnvId;
      }

      const blob = await api.analytics.export(projectId, params);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${projectId}-${timeRange}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Analytics data has been downloaded.",
      });
    } catch (err) {
      console.error("Failed to export:", err);
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Get top flags with variations for distribution chart
  const flagsWithVariations = flagStats?.filter(
    (f) => f.variations.length > 0 && f.totalEvaluations > 0
  ).slice(0, 4) || [];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Analytics"
        description="Monitor flag evaluations and user exposure"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project", href: `/projects/${projectId}` },
          { label: "Analytics" },
        ]}
        actions={
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || isLoading}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export CSV
            </Button>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedEnvId || "all"} onValueChange={(v) => setSelectedEnvId(v === "all" ? "" : v)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                {environments?.map((env) => (
                  <SelectItem key={env.id} value={env.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: env.color || "#6366f1" }}
                      />
                      {env.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto">

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Evaluations
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(overview?.totalEvaluations || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    In selected period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(overview?.uniqueUsers || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Exposed to flags
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Flags</CardTitle>
                  <Flag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overview?.activeFlags || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {overview?.totalFlags || 0} total flags
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Evaluations/User
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {overview?.uniqueUsers
                      ? (overview.totalEvaluations / overview.uniqueUsers).toFixed(1)
                      : "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Per user average
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Evaluations by Day Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evaluations Over Time</CardTitle>
                  <CardDescription>
                    {timeRange === "24h" ? "Hourly" : "Daily"} flag evaluations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {timeSeries && timeSeries.length > 0 ? (
                    <div className="h-64 flex flex-col gap-2">
                      {(() => {
                        const points = timeSeries.slice(-14);
                        const maxCount = Math.max(...points.map((d) => d.evaluations), 1);
                        return (
                          <>
                            <div className="flex-1 flex items-end gap-1">
                              {points.map((point) => {
                                const heightPct = (point.evaluations / maxCount) * 100;
                                return (
                                  <div
                                    key={point.timestamp}
                                    className="flex-1 h-full flex items-end"
                                  >
                                    <div
                                      className="w-full bg-primary rounded-t transition-all hover:bg-primary/80 min-h-[2px]"
                                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                                      title={`${point.evaluations.toLocaleString()} evaluations`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            {points.length <= 14 && (
                              <div className="flex gap-1">
                                {points.map((point) => (
                                  <div key={`lbl-${point.timestamp}`} className="flex-1 text-center">
                                    <span className="text-xs text-muted-foreground truncate block">
                                      {timeRange === "24h"
                                        ? new Date(point.timestamp).toLocaleTimeString("en-US", { hour: "numeric" })
                                        : new Date(point.timestamp).toLocaleDateString("en-US", { weekday: "short" })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      No data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Flags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Flags by Evaluations</CardTitle>
                  <CardDescription>Most evaluated flags</CardDescription>
                </CardHeader>
                <CardContent>
                  {flagStats && flagStats.length > 0 ? (
                    <div className="space-y-4">
                      {flagStats.slice(0, 5).map((flag, i) => {
                        const maxCount = flagStats[0]?.totalEvaluations || 1;
                        const width = (flag.totalEvaluations / maxCount) * 100;
                        return (
                          <div key={flag.flagId} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{flag.flagName}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {flag.flagKey}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {flag.totalEvaluations.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {flag.uniqueUsers.toLocaleString()} users
                                </p>
                              </div>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No flag evaluations in this period
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Users</CardTitle>
                  <CardDescription>Users with most evaluations</CardDescription>
                </CardHeader>
                <CardContent>
                  {topUsers && topUsers.length > 0 ? (
                    <div className="space-y-3">
                      {topUsers.map((user, i) => (
                        <div
                          key={user.userKey}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                              {i + 1}
                            </div>
                            <span className="font-mono text-sm truncate max-w-[200px]">
                              {user.userKey}
                            </span>
                          </div>
                          <Badge variant="secondary">
                            {user.evaluations.toLocaleString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No user data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Variation Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Variation Distribution</CardTitle>
                  <CardDescription>
                    Traffic split across flag variations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {flagsWithVariations.length > 0 ? (
                    <div className="space-y-6">
                      {flagsWithVariations.map((flag) => (
                        <div key={flag.flagId} className="space-y-3">
                          <p className="font-medium font-mono text-sm">
                            {flag.flagKey}
                          </p>
                          <div className="flex h-4 rounded-full overflow-hidden">
                            {flag.variations.map((v, i) => (
                              <div
                                key={v.variationKey}
                                className={`transition-all ${
                                  i === 0
                                    ? "bg-primary"
                                    : i === 1
                                    ? "bg-blue-500"
                                    : i === 2
                                    ? "bg-green-500"
                                    : "bg-orange-500"
                                }`}
                                style={{ width: `${v.percentage}%` }}
                                title={`${v.variationKey}: ${v.percentage.toFixed(1)}%`}
                              />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-4">
                            {flag.variations.map((v, i) => (
                              <div key={v.variationKey} className="flex items-center gap-2">
                                <div
                                  className={`h-3 w-3 rounded-full ${
                                    i === 0
                                      ? "bg-primary"
                                      : i === 1
                                      ? "bg-blue-500"
                                      : i === 2
                                      ? "bg-green-500"
                                      : "bg-orange-500"
                                  }`}
                                />
                                <span className="text-sm">
                                  {v.variationKey}: {v.percentage.toFixed(1)}% (
                                  {v.count.toLocaleString()})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No variation data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
