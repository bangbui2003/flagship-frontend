"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Flag, Globe, Users, Activity, ArrowRight, CheckCircle, Clock, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { fetcher, api, type Project, type Flag as FlagType, type Environment, type Segment } from "@/lib/api";
import { AlertCircle } from "lucide-react";

interface AuditLog {
  id: string;
  entityType: string;
  action: string;
  actor: string;
  createdAt: string;
  diff: Record<string, unknown>;
}

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  
  const { data: project } = useSWR<Project>(
    `/v1/projects/${projectId}`,
    fetcher
  );
  const { data: flags } = useSWR<FlagType[]>(
    `/v1/projects/${projectId}/flags`,
    fetcher
  );
  const { data: environments } = useSWR<Environment[]>(
    `/v1/projects/${projectId}/environments`,
    fetcher
  );
  const { data: segments } = useSWR<Segment[]>(
    `/v1/projects/${projectId}/segments`,
    fetcher
  );
  const { data: auditLogs } = useSWR<AuditLog[]>(
    `/v1/projects/${projectId}/audit-logs?limit=5`,
    fetcher
  );
  const { data: health } = useSWR(
    "/health/ready",
    () => api.health.ready(),
    { refreshInterval: 30000 }
  );

  const stats = [
    {
      title: "Feature Flags",
      value: flags?.length ?? 0,
      icon: Flag,
      href: `/projects/${projectId}/flags`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Environments",
      value: environments?.length ?? 0,
      icon: Globe,
      href: `/projects/${projectId}/environments`,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Segments",
      value: segments?.length ?? 0,
      icon: Users,
      href: `/projects/${projectId}/segments`,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Analytics",
      value: "View",
      icon: BarChart3,
      href: `/projects/${projectId}/analytics`,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActionColor = (action: string) => {
    if (action.includes("create")) return "bg-green-500/10 text-green-500";
    if (action.includes("delete")) return "bg-red-500/10 text-red-500";
    if (action.includes("toggle")) return "bg-yellow-500/10 text-yellow-500";
    return "bg-blue-500/10 text-blue-500";
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Dashboard"
        description={project?.description || "Manage your feature flags and configurations"}
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project" },
        ]}
      />
      
      <div className="flex-1 p-6 space-y-6 overflow-auto">

        {/* System Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 flex-wrap">
              {health ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">API: Operational</span>
                  </div>
                  {Object.entries(health.checks).map(([name, check]) => {
                    const ok = check.status === "ok";
                    return (
                      <div key={name} className="flex items-center gap-2">
                        {ok ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="text-sm capitalize">
                          {name}: {ok ? "Healthy" : "Degraded"}
                          {check.latency !== undefined && (
                            <span className="text-muted-foreground ml-1">({check.latency}ms)</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="text-sm">SSE: {environments?.length || 0} env streams</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Checking health...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <Link
                  href={stat.href}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-2"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Flags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Flags</CardTitle>
              <CardDescription>
                Your most recently created feature flags
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flags?.length === 0 ? (
                <div className="text-center py-6">
                  <Flag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No flags yet</p>
                  <Button asChild variant="link" className="mt-2">
                    <Link href={`/projects/${projectId}/flags`}>
                      Create your first flag
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {flags?.slice(0, 5).map((flag) => (
                    <Link
                      key={flag.id}
                      href={`/projects/${projectId}/flags/${flag.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Flag className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{flag.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {flag.key}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                  {(flags?.length ?? 0) > 5 && (
                    <Button asChild variant="ghost" className="w-full">
                      <Link href={`/projects/${projectId}/flags`}>
                        View all flags
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>
                Latest changes in this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!auditLogs?.length ? (
                <div className="text-center py-6">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm capitalize">
                            {log.entityType}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            by {log.actor}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(log.createdAt)}
                      </span>
                    </div>
                  ))}
                  <Button asChild variant="ghost" className="w-full">
                    <Link href={`/projects/${projectId}/audit-logs`}>
                      View all activity
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Environments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Environments</CardTitle>
            <CardDescription>
              Your deployment environments and SDK keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            {environments?.length === 0 ? (
              <div className="text-center py-6">
                <Globe className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No environments yet
                </p>
                <Button asChild variant="link" className="mt-2">
                  <Link href={`/projects/${projectId}/environments`}>
                    Create an environment
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {environments?.map((env) => (
                  <div
                    key={env.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: env.color || "#6366f1",
                        }}
                      />
                      <div>
                        <div className="font-medium text-sm">{env.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {env.key}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
