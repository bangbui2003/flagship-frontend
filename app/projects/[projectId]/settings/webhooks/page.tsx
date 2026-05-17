"use client";

import { use, useState } from "react";
import useSWR from "swr";
import {
  Webhook,
  Plus,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  Copy,
  Eye,
  EyeOff,
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/layout/page-header";
import { fetcher, API_BASE_URL, type Project } from "@/lib/api";

interface WebhookType {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

const WEBHOOK_EVENTS = [
  { key: "flag.created", label: "Flag Created" },
  { key: "flag.updated", label: "Flag Updated" },
  { key: "flag.toggled", label: "Flag Toggled" },
  { key: "flag.deleted", label: "Flag Deleted" },
  { key: "environment.created", label: "Environment Created" },
  { key: "segment.updated", label: "Segment Updated" },
];

export default function WebhooksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);

  const { data: project } = useSWR<Project>(
    `/v1/projects/${projectId}`,
    fetcher
  );
  const { data: webhooks, mutate } = useSWR<WebhookType[]>(
    `/v1/projects/${projectId}/webhooks`,
    fetcher
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: ["flag.updated"],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/v1/projects/${projectId}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      });
      setNewWebhook({ name: "", url: "", events: ["flag.updated"] });
      setIsCreateOpen(false);
      mutate();
    } catch (err) {
      console.error("Failed to create webhook:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (webhookId: string, isActive: boolean) => {
    try {
      await fetch(`${API_BASE_URL}/v1/projects/${projectId}/webhooks/${webhookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      mutate();
    } catch (err) {
      console.error("Failed to toggle webhook:", err);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;
    try {
      await fetch(`${API_BASE_URL}/v1/projects/${projectId}/webhooks/${webhookId}`, {
        method: "DELETE",
      });
      mutate();
    } catch (err) {
      console.error("Failed to delete webhook:", err);
    }
  };

  const handleTest = async (webhookId: string) => {
    setTestResults((prev) => ({ ...prev, [webhookId]: { loading: true } }));
    try {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/webhooks/${webhookId}/test`,
        { method: "POST" }
      );
      const result = await res.json();
      setTestResults((prev) => ({ ...prev, [webhookId]: result }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [webhookId]: { success: false, message: "Test failed" },
      }));
    }
  };

  const toggleEvent = (event: string) => {
    if (newWebhook.events.includes(event)) {
      setNewWebhook({
        ...newWebhook,
        events: newWebhook.events.filter((e) => e !== event),
      });
    } else {
      setNewWebhook({
        ...newWebhook,
        events: [...newWebhook.events, event],
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Webhooks"
        description="Get notified when events happen in your project"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project", href: `/projects/${projectId}` },
          { label: "Settings", href: `/projects/${projectId}/settings` },
          { label: "Webhooks" },
        ]}
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Webhook</DialogTitle>
                  <DialogDescription>
                    Configure a webhook to receive event notifications
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="My Webhook"
                      value={newWebhook.name}
                      onChange={(e) =>
                        setNewWebhook({ ...newWebhook, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>URL</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/webhook"
                      value={newWebhook.url}
                      onChange={(e) =>
                        setNewWebhook({ ...newWebhook, url: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Events</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {WEBHOOK_EVENTS.map((event) => (
                        <div
                          key={event.key}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={event.key}
                            checked={newWebhook.events.includes(event.key)}
                            onCheckedChange={() => toggleEvent(event.key)}
                          />
                          <label
                            htmlFor={event.key}
                            className="text-sm cursor-pointer"
                          >
                            {event.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Webhook"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        {!webhooks?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No webhooks yet</h3>
              <p className="text-muted-foreground mb-4">
                Create a webhook to receive notifications
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                testResult={testResults[webhook.id]}
                onToggle={() => handleToggle(webhook.id, webhook.isActive)}
                onDelete={() => handleDelete(webhook.id)}
                onTest={() => handleTest(webhook.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WebhookCard({
  webhook,
  testResult,
  onToggle,
  onDelete,
  onTest,
}: {
  webhook: WebhookType;
  testResult?: any;
  onToggle: () => void;
  onDelete: () => void;
  onTest: () => void;
}) {
  const [showSecret, setShowSecret] = useState(false);

  const copySecret = () => {
    navigator.clipboard.writeText(webhook.secret);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                webhook.isActive ? "bg-green-500/10" : "bg-gray-500/10"
              }`}
            >
              <Webhook
                className={`h-5 w-5 ${
                  webhook.isActive ? "text-green-500" : "text-gray-500"
                }`}
              />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {webhook.name}
                {webhook.isActive ? (
                  <Badge variant="default" className="bg-green-500">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </CardTitle>
              <CardDescription className="font-mono text-xs truncate max-w-md">
                {webhook.url}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={webhook.isActive} onCheckedChange={onToggle} />
            <Button variant="outline" size="sm" onClick={onTest}>
              <Play className="mr-2 h-4 w-4" />
              Test
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Events */}
          <div>
            <p className="text-sm font-medium mb-2">Events</p>
            <div className="flex flex-wrap gap-2">
              {webhook.events.map((event) => (
                <Badge key={event} variant="outline">
                  {event}
                </Badge>
              ))}
            </div>
          </div>

          {/* Secret */}
          <div>
            <p className="text-sm font-medium mb-2">Signing Secret</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                {showSecret ? webhook.secret : "••••••••••••••••••••••••"}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={copySecret}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                testResult.loading
                  ? "bg-muted"
                  : testResult.success
                  ? "bg-green-500/10"
                  : "bg-red-500/10"
              }`}
            >
              {testResult.loading ? (
                <span className="text-sm">Testing...</span>
              ) : testResult.success ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700">
                    {testResult.message}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">
                    {testResult.message}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
