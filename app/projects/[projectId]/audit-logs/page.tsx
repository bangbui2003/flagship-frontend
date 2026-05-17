"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { Activity, Filter, ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { fetcher, type AuditLog, type Project } from "@/lib/api";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-500",
  update: "bg-blue-500",
  delete: "bg-red-500",
  enable: "bg-emerald-500",
  disable: "bg-orange-500",
  archive: "bg-gray-500",
  restore: "bg-purple-500",
};

const ENTITY_LABELS: Record<string, string> = {
  project: "Project",
  environment: "Environment",
  flag: "Flag",
  flag_version: "Flag Version",
  variation: "Variation",
  targeting_rule: "Targeting Rule",
  segment: "Segment",
  schedule: "Schedule",
  webhook: "Webhook",
};

const ENTITY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "project", label: "Project" },
  { value: "environment", label: "Environment" },
  { value: "flag", label: "Flag" },
  { value: "flag_version", label: "Flag Version" },
  { value: "variation", label: "Variation" },
  { value: "targeting_rule", label: "Targeting Rule" },
  { value: "segment", label: "Segment" },
  { value: "schedule", label: "Schedule" },
  { value: "webhook", label: "Webhook" },
];

const ACTIONS = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "enable", label: "Enable" },
  { value: "disable", label: "Disable" },
  { value: "archive", label: "Archive" },
  { value: "restore", label: "Restore" },
];

export default function AuditLogsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [page, setPage] = useState(0);
  const [entityType, setEntityType] = useState("all");
  const [action, setAction] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const limit = 20;

  const { data: project } = useSWR<Project>(
    `/v1/projects/${projectId}`,
    fetcher
  );

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set("limit", limit.toString());
    params.set("offset", (page * limit).toString());
    
    if (entityType !== "all") {
      params.set("entityType", entityType);
    }
    if (action !== "all") {
      params.set("action", action);
    }
    if (startDate) {
      params.set("startDate", new Date(startDate).toISOString());
    }
    if (endDate) {
      params.set("endDate", new Date(endDate + "T23:59:59").toISOString());
    }
    
    return params.toString();
  };

  const { data, error, isLoading } = useSWR<{
    data: AuditLog[];
    total: number;
    limit: number;
    offset: number;
  }>(
    `/v1/projects/${projectId}/audit-logs?${buildQueryParams()}`,
    fetcher
  );

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  const hasActiveFilters = entityType !== "all" || action !== "all" || startDate || endDate;

  const clearFilters = () => {
    setEntityType("all");
    setAction("all");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const handleFilterChange = () => {
    setPage(0); // Reset to first page when filters change
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Audit Logs"
        description="Track all changes made to your project"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project", href: `/projects/${projectId}` },
          { label: "Audit Logs" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      {[entityType !== "all", action !== "all", startDate, endDate].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filter Audit Logs</h4>
                    <p className="text-sm text-muted-foreground">
                      Narrow down the logs by type, action, or date range.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <div className="grid gap-2">
                      <Label>Entity Type</Label>
                      <Select 
                        value={entityType} 
                        onValueChange={(v) => { setEntityType(v); handleFilterChange(); }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ENTITY_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Action</Label>
                      <Select 
                        value={action} 
                        onValueChange={(v) => { setAction(v); handleFilterChange(); }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIONS.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); handleFilterChange(); }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); handleFilterChange(); }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear
                    </Button>
                    <Button size="sm" onClick={() => setIsFilterOpen(false)}>
                      Apply
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        }
      />
      
      <div className="flex-1 p-6 overflow-auto">
        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {entityType !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Type: {ENTITY_LABELS[entityType] || entityType}
                <button onClick={() => { setEntityType("all"); handleFilterChange(); }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {action !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Action: {action}
                <button onClick={() => { setAction("all"); handleFilterChange(); }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {startDate && (
              <Badge variant="secondary" className="gap-1">
                From: {startDate}
                <button onClick={() => { setStartDate(""); handleFilterChange(); }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {endDate && (
              <Badge variant="secondary" className="gap-1">
                To: {endDate}
                <button onClick={() => { setEndDate(""); handleFilterChange(); }}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-4">
                  <div className="h-5 w-64 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load audit logs.</p>
            </CardContent>
          </Card>
        ) : data?.data.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={hasActiveFilters ? "No matching logs" : "No audit logs yet"}
            description={hasActiveFilters ? "Try adjusting your filters." : "Changes to your project will appear here."}
            action={hasActiveFilters ? { label: "Clear Filters", onClick: clearFilters } : undefined}
          />
        ) : (
          <>
            <div className="space-y-3">
              {data?.data.map((log) => (
                <AuditLogItem key={log.id} log={log} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {page * limit + 1} to{" "}
                  {Math.min((page + 1) * limit, data?.total || 0)} of{" "}
                  {data?.total} entries
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AuditLogItem({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);

  const actionColor = ACTION_COLORS[log.action] || "bg-gray-500";
  const entityLabel = ENTITY_LABELS[log.entityType] || log.entityType;

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-2 w-2 rounded-full ${actionColor}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">{log.action}</span>
                <Badge variant="outline" className="text-xs">
                  {entityLabel}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                by <span className="font-medium">{log.actor}</span>
                {log.entityId && (
                  <span className="ml-2 font-mono text-xs">
                    ID: {log.entityId.slice(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(log.createdAt).toLocaleString()}
          </div>
        </div>

        {expanded && log.diff != null && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <pre className="text-xs overflow-auto max-h-64">
              {JSON.stringify(log.diff, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
