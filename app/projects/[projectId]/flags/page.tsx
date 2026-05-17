"use client";

import { use, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, Flag, Search, Archive, Loader2, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { api, fetcher, type Flag as FlagType, type Environment, type FlagVersion, type Project } from "@/lib/api";

// Validation helpers
const validateKey = (key: string): string | null => {
  if (!key) return "Key is required";
  if (key.length < 2) return "Key must be at least 2 characters";
  if (key.length > 64) return "Key must be less than 64 characters";
  if (!/^[a-z][a-z0-9_-]*$/.test(key)) {
    return "Key must start with a letter and contain only lowercase letters, numbers, hyphens, and underscores";
  }
  return null;
};

export default function FlagsPage({
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
  const { data: flags, error, isLoading, mutate } = useSWR<FlagType[]>(
    `/v1/projects/${projectId}/flags`,
    fetcher
  );
  const { data: environments } = useSWR<Environment[]>(
    `/v1/projects/${projectId}/environments`,
    fetcher
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: "", name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);
  const [deleteFlag, setDeleteFlag] = useState<FlagType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate key
    const error = validateKey(newFlag.key);
    if (error) {
      setKeyError(error);
      return;
    }

    // Check for duplicate key
    if (flags?.some(f => f.key === newFlag.key)) {
      setKeyError("A flag with this key already exists");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.flags.create(projectId, newFlag);
      setNewFlag({ key: "", name: "", description: "" });
      setKeyError(null);
      setIsCreateOpen(false);
      mutate();
      toast({
        title: "Flag created",
        description: `${newFlag.name} has been created successfully.`,
      });
    } catch (err) {
      console.error("Failed to create flag:", err);
      toast({
        title: "Failed to create flag",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFlag = async () => {
    if (!deleteFlag) return;
    
    setIsDeleting(true);
    try {
      await api.flags.delete(projectId, deleteFlag.id);
      mutate();
      toast({
        title: "Flag deleted",
        description: `${deleteFlag.name} has been permanently deleted.`,
      });
      setDeleteFlag(null);
    } catch (err) {
      console.error("Failed to delete flag:", err);
      toast({
        title: "Failed to delete flag",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchiveFlag = async (flagId: string, flagName: string, archived: boolean) => {
    try {
      await api.flags.update(projectId, flagId, { archived: !archived });
      mutate();
      toast({
        title: archived ? "Flag restored" : "Flag archived",
        description: `${flagName} has been ${archived ? "restored" : "archived"}.`,
      });
    } catch (err) {
      console.error("Failed to archive flag:", err);
      toast({
        title: "Failed to update flag",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const filteredFlags = flags?.filter(
    (flag) =>
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-generate key from name
  const handleNameChange = (name: string) => {
    const key = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setNewFlag({ ...newFlag, name, key });
    setKeyError(null);
  };

  const handleKeyChange = (key: string) => {
    setNewFlag({ ...newFlag, key });
    setKeyError(validateKey(key));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFlag} onOpenChange={(open) => !open && setDeleteFlag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteFlag?.name}</strong>? This action cannot be undone.
              All flag versions, variations, and targeting rules will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFlag}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Flag"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <PageHeader
        title="Feature Flags"
        description="Manage your feature flags and rollouts"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project", href: `/projects/${projectId}` },
          { label: "Flags" },
        ]}
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Flag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateFlag}>
                <DialogHeader>
                  <DialogTitle>Create Feature Flag</DialogTitle>
                  <DialogDescription>
                    Create a new feature flag to control feature rollouts.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="New Feature"
                      value={newFlag.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="key">Key</Label>
                    <Input
                      id="key"
                      placeholder="new-feature"
                      value={newFlag.key}
                      onChange={(e) => handleKeyChange(e.target.value)}
                      required
                      className={`font-mono ${keyError ? "border-destructive" : ""}`}
                      disabled={isSubmitting}
                    />
                    {keyError ? (
                      <p className="text-xs text-destructive">{keyError}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        This is the key you&apos;ll use in your code to check the flag.
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="A brief description of this feature flag"
                      value={newFlag.description}
                      onChange={(e) =>
                        setNewFlag({ ...newFlag, description: e.target.value })
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !!keyError}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Flag
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      
      <div className="flex-1 p-6 animate-in fade-in-0 duration-300">
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-4 w-48 bg-muted rounded" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Failed to load flags.</p>
              <Button variant="outline" className="mt-4" onClick={() => mutate()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredFlags?.length === 0 ? (
          searchQuery ? (
            <EmptyState
              icon={Flag}
              title="No flags found"
              description="Try a different search term"
            />
          ) : (
            <EmptyState
              icon={Flag}
              title="No flags yet"
              description="Create your first feature flag to get started."
              action={{
                label: "Create Flag",
                onClick: () => setIsCreateOpen(true),
              }}
            />
          )
        ) : (
          <div className="space-y-4">
            {filteredFlags?.map((flag) => (
              <FlagCard
                key={flag.id}
                flag={flag}
                projectId={projectId}
                environments={environments || []}
                onArchive={() => handleArchiveFlag(flag.id, flag.name, flag.archived)}
                onDelete={() => setDeleteFlag(flag)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FlagCard({
  flag,
  projectId,
  environments,
  onArchive,
  onDelete,
}: {
  flag: FlagType;
  projectId: string;
  environments: Environment[];
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${flag.archived ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link href={`/projects/${projectId}/flags/${flag.id}`} className="flex items-center gap-3 hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Flag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{flag.name}</CardTitle>
                {flag.archived && (
                  <Badge variant="secondary">Archived</Badge>
                )}
              </div>
              <CardDescription className="font-mono text-xs">
                {flag.key}
              </CardDescription>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onArchive}
              aria-label={flag.archived ? "Restore flag" : "Archive flag"}
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label="Delete flag"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {flag.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {flag.description}
          </p>
        )}
        
        {/* Environment toggles */}
        <div className="flex flex-wrap gap-4">
          {environments.map((env) => (
            <EnvironmentToggle
              key={env.id}
              projectId={projectId}
              flagId={flag.id}
              environment={env}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EnvironmentToggle({
  projectId,
  flagId,
  environment,
}: {
  projectId: string;
  flagId: string;
  environment: Environment;
}) {
  const { toast } = useToast();
  const { data: version, mutate } = useSWR<FlagVersion>(
    `/v1/projects/${projectId}/flags/${flagId}/environments/${environment.id}/versions/latest`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await api.versions.create(projectId, flagId, environment.id, {
        isEnabled: !version?.isEnabled,
      });
      mutate();
      toast({
        title: `Flag ${!version?.isEnabled ? "enabled" : "disabled"}`,
        description: `Flag is now ${!version?.isEnabled ? "enabled" : "disabled"} in ${environment.name}.`,
      });
    } catch (err) {
      console.error("Failed to toggle flag:", err);
      toast({
        title: "Failed to toggle flag",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: environment.color || "#6366f1" }}
        aria-hidden="true"
      />
      <span className="text-sm text-muted-foreground">{environment.name}</span>
      <Switch
        checked={version?.isEnabled ?? false}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        aria-label={`Toggle flag in ${environment.name}`}
        aria-busy={isUpdating}
      />
    </div>
  );
}
