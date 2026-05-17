"use client";

import { use, useState } from "react";
import useSWR from "swr";
import {
  Clock,
  Plus,
  Trash2,
  XCircle,
  CheckCircle,
  Calendar,
  Flag,
  Play,
  Pause,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/use-toast";
import { api, fetcher, API_BASE_URL, type Flag as FlagType, type Environment, type Project, type Schedule } from "@/lib/api";

interface FlagVersion {
  id: string;
  flagId: string;
  environmentId: string;
  version: number;
  isEnabled: boolean;
}

export default function SchedulesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { toast } = useToast();

  const { data: project } = useSWR<Project>(
    `/v1/projects/${projectId}`,
    fetcher
  );

  const { data: schedules, mutate } = useSWR<Schedule[]>(
    `/v1/projects/${projectId}/schedules`,
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

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedFlagId, setSelectedFlagId] = useState("");
  const [selectedEnvId, setSelectedEnvId] = useState("");
  const [flagVersions, setFlagVersions] = useState<FlagVersion[]>([]);
  const [newSchedule, setNewSchedule] = useState({
    flagVersionId: "",
    action: "enable" as "enable" | "disable" | "update_rollout",
    scheduledAt: "",
  });
  const [editSchedule, setEditSchedule] = useState({
    action: "enable" as "enable" | "disable" | "update_rollout",
    scheduledAt: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchFlagVersions = async (flagId: string, envId: string) => {
    if (!flagId || !envId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${flagId}/environments/${envId}/versions`
      );
      const data = await res.json();
      setFlagVersions(data);
      if (data.length > 0) {
        setNewSchedule((prev) => ({ ...prev, flagVersionId: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to fetch flag versions:", err);
    }
  };

  const handleFlagChange = (flagId: string) => {
    setSelectedFlagId(flagId);
    if (selectedEnvId) fetchFlagVersions(flagId, selectedEnvId);
  };

  const handleEnvChange = (envId: string) => {
    setSelectedEnvId(envId);
    if (selectedFlagId) fetchFlagVersions(selectedFlagId, envId);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.schedules.create(projectId, {
        ...newSchedule,
        scheduledAt: new Date(newSchedule.scheduledAt).toISOString(),
      });
      setNewSchedule({ flagVersionId: "", action: "enable", scheduledAt: "" });
      setSelectedFlagId("");
      setSelectedEnvId("");
      setFlagVersions([]);
      setIsCreateOpen(false);
      mutate();
      toast({
        title: "Schedule created",
        description: "The scheduled change has been created successfully.",
      });
    } catch (err) {
      console.error("Failed to create schedule:", err);
      toast({
        title: "Failed to create schedule",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setEditSchedule({
      action: schedule.action,
      scheduledAt: new Date(schedule.scheduledAt).toISOString().slice(0, 16),
    });
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    
    setIsSubmitting(true);
    try {
      await api.schedules.update(projectId, editingSchedule.id, {
        action: editSchedule.action,
        scheduledAt: new Date(editSchedule.scheduledAt).toISOString(),
      });
      setIsEditOpen(false);
      setEditingSchedule(null);
      mutate();
      toast({
        title: "Schedule updated",
        description: "The scheduled change has been updated successfully.",
      });
    } catch (err) {
      console.error("Failed to update schedule:", err);
      toast({
        title: "Failed to update schedule",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to cancel this schedule?")) return;
    try {
      await api.schedules.cancel(projectId, scheduleId);
      mutate();
      toast({
        title: "Schedule cancelled",
        description: "The scheduled change has been cancelled.",
      });
    } catch (err) {
      console.error("Failed to cancel schedule:", err);
      toast({
        title: "Failed to cancel schedule",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await api.schedules.delete(projectId, scheduleId);
      mutate();
      toast({
        title: "Schedule deleted",
        description: "The scheduled change has been deleted.",
      });
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      toast({
        title: "Failed to delete schedule",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const filteredSchedules = schedules?.filter((s) =>
    statusFilter === "all" ? true : s.status === statusFilter
  );

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "executed":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Executed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-600">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "enable":
        return (
          <Badge className="bg-green-500">
            <Play className="mr-1 h-3 w-3" />
            Enable
          </Badge>
        );
      case "disable":
        return (
          <Badge variant="destructive">
            <Pause className="mr-1 h-3 w-3" />
            Disable
          </Badge>
        );
      case "update_rollout":
        return <Badge variant="secondary">Update Rollout</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Scheduled Changes"
        description="Schedule flag changes to happen automatically at a specific time"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project", href: `/projects/${projectId}` },
          { label: "Settings", href: `/projects/${projectId}/settings` },
          { label: "Schedules" },
        ]}
        actions={
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="executed">Executed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Change
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Schedule Flag Change</DialogTitle>
                    <DialogDescription>
                      Schedule a flag to be enabled or disabled at a specific time
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Flag</Label>
                      <Select value={selectedFlagId} onValueChange={handleFlagChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a flag" />
                        </SelectTrigger>
                        <SelectContent>
                          {flags?.map((flag) => (
                            <SelectItem key={flag.id} value={flag.id}>
                              {flag.name} ({flag.key})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Environment</Label>
                      <Select value={selectedEnvId} onValueChange={handleEnvChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an environment" />
                        </SelectTrigger>
                        <SelectContent>
                          {environments?.map((env) => (
                            <SelectItem key={env.id} value={env.id}>
                              {env.name} ({env.key})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {flagVersions.length > 0 && (
                      <div className="grid gap-2">
                        <Label>Flag Version</Label>
                        <Select
                          value={newSchedule.flagVersionId}
                          onValueChange={(v) => setNewSchedule({ ...newSchedule, flagVersionId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select version" />
                          </SelectTrigger>
                          <SelectContent>
                            {flagVersions.map((fv) => (
                              <SelectItem key={fv.id} value={fv.id}>
                                Version {fv.version} ({fv.isEnabled ? "Enabled" : "Disabled"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label>Action</Label>
                      <Select
                        value={newSchedule.action}
                        onValueChange={(v: "enable" | "disable" | "update_rollout") =>
                          setNewSchedule({ ...newSchedule, action: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enable">Enable Flag</SelectItem>
                          <SelectItem value="disable">Disable Flag</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Scheduled Time</Label>
                      <Input
                        type="datetime-local"
                        min={getMinDateTime()}
                        value={newSchedule.scheduledAt}
                        onChange={(e) => setNewSchedule({ ...newSchedule, scheduledAt: e.target.value })}
                        required
                      />
                      <p className="text-xs text-muted-foreground">Time is in your local timezone</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !newSchedule.flagVersionId || !newSchedule.scheduledAt}
                    >
                      {isSubmitting ? "Scheduling..." : "Schedule Change"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit Schedule</DialogTitle>
              <DialogDescription>
                Update the scheduled time or action
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Action</Label>
                <Select
                  value={editSchedule.action}
                  onValueChange={(v: "enable" | "disable" | "update_rollout") =>
                    setEditSchedule({ ...editSchedule, action: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enable">Enable Flag</SelectItem>
                    <SelectItem value="disable">Disable Flag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Scheduled Time</Label>
                <Input
                  type="datetime-local"
                  min={getMinDateTime()}
                  value={editSchedule.scheduledAt}
                  onChange={(e) => setEditSchedule({ ...editSchedule, scheduledAt: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Time is in your local timezone</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex-1 p-6 overflow-auto">
        {!filteredSchedules?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scheduled changes</h3>
              <p className="text-muted-foreground mb-4">Schedule flag changes to happen automatically</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Change
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSchedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Flag className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {schedule.flag?.name || "Unknown Flag"}
                          {getStatusBadge(schedule.status)}
                        </CardTitle>
                        <CardDescription>
                          {schedule.environment?.name || "Unknown Environment"} • {schedule.flag?.key}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getActionBadge(schedule.action)}
                      {schedule.status === "pending" && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(schedule)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleCancel(schedule.id)}>
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Scheduled For</p>
                      <p className="font-medium">{new Date(schedule.scheduledAt).toLocaleString()}</p>
                    </div>
                    {schedule.executedAt && (
                      <div>
                        <p className="text-muted-foreground">Executed At</p>
                        <p className="font-medium">{new Date(schedule.executedAt).toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{new Date(schedule.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
