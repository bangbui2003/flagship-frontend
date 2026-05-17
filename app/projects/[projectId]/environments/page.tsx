"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { Plus, Globe, Copy, Check, Eye, EyeOff, Pencil, Trash2, MoreVertical, Loader2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/components/ui/use-toast";
import { api, fetcher, type Environment, type Project } from "@/lib/api";

const COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

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

export default function EnvironmentsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { toast } = useToast();
  
  const { data: project } = useSWR<Project>(`/v1/projects/${projectId}`, fetcher);
  const { data: environments, error, isLoading, mutate } = useSWR<Environment[]>(
    `/v1/projects/${projectId}/environments`,
    fetcher
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEnv, setNewEnv] = useState({ key: "", name: "", color: COLORS[0] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editEnv, setEditEnv] = useState<Environment | null>(null);
  const [editForm, setEditForm] = useState({ name: "", color: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [deleteEnv, setDeleteEnv] = useState<Environment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate key
    const error = validateKey(newEnv.key);
    if (error) {
      setKeyError(error);
      return;
    }

    // Check for duplicate key
    if (environments?.some(env => env.key === newEnv.key)) {
      setKeyError("An environment with this key already exists");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.environments.create(projectId, newEnv);
      setNewEnv({ key: "", name: "", color: COLORS[0] });
      setKeyError(null);
      setIsCreateOpen(false);
      mutate();
      toast({ title: "Environment created", description: `${newEnv.name} has been created successfully.` });
    } catch (err) {
      toast({ title: "Failed to create environment", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEnv) return;
    setIsEditing(true);
    try {
      await api.environments.update(projectId, editEnv.id, editForm);
      mutate();
      toast({ title: "Environment updated", description: `${editForm.name} has been updated.` });
      setEditEnv(null);
    } catch (err) {
      toast({ title: "Failed to update environment", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteEnvironment = async () => {
    if (!deleteEnv) return;
    setIsDeleting(true);
    try {
      await api.environments.delete(projectId, deleteEnv.id);
      mutate();
      toast({ title: "Environment deleted", description: `${deleteEnv.name} has been deleted.` });
      setDeleteEnv(null);
    } catch (err) {
      toast({ title: "Failed to delete environment", description: err instanceof Error ? err.message : "Please try again", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloneEnvironment = (env: Environment) => {
    setNewEnv({
      key: `${env.key}-copy`,
      name: `${env.name} (Copy)`,
      color: COLORS[(COLORS.indexOf(env.color || COLORS[0]) + 1) % COLORS.length],
    });
    setIsCreateOpen(true);
  };

  const openEditDialog = (env: Environment) => {
    setEditForm({ name: env.name, color: env.color || COLORS[0] });
    setEditEnv(env);
  };

  const handleNameChange = (name: string) => {
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setNewEnv({ ...newEnv, name, key });
    setKeyError(null);
  };

  const handleKeyChange = (key: string) => {
    setNewEnv({ ...newEnv, key });
    setKeyError(validateKey(key));
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Environments"
        description="Manage your deployment environments and API keys"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project", href: `/projects/${projectId}` },
          { label: "Environments" },
        ]}
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />New Environment</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateEnvironment}>
                <DialogHeader>
                  <DialogTitle>Create Environment</DialogTitle>
                  <DialogDescription>Create a new environment for your feature flags.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Production" value={newEnv.name} onChange={(e) => handleNameChange(e.target.value)} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="key">Key</Label>
                    <Input id="key" placeholder="production" value={newEnv.key} onChange={(e) => handleKeyChange(e.target.value)} required className={`font-mono ${keyError ? "border-destructive" : ""}`} />
                    {keyError ? (
                      <p className="text-xs text-destructive">{keyError}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Unique identifier for this environment.</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Color</Label>
                    <div className="flex gap-2">
                      {COLORS.map((color) => (
                        <button key={color} type="button" className={`h-8 w-8 rounded-full border-2 transition-all ${newEnv.color === color ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: color }} onClick={() => setNewEnv({ ...newEnv, color })} />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting || !!keyError}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Creating..." : "Create Environment"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      
      <div className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (<Card key={i} className="animate-pulse"><CardHeader><div className="h-5 w-32 bg-muted rounded" /><div className="h-4 w-48 bg-muted rounded" /></CardHeader></Card>))}
          </div>
        ) : error ? (
          <Card className="border-destructive"><CardContent className="pt-6"><p className="text-destructive">Failed to load environments.</p><Button variant="outline" className="mt-4" onClick={() => mutate()}>Retry</Button></CardContent></Card>
        ) : environments?.length === 0 ? (
          <EmptyState icon={Globe} title="No environments yet" description="Create environments like Development, Staging, and Production." action={{ label: "Create Environment", onClick: () => setIsCreateOpen(true) }} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {environments?.map((env) => (
              <EnvironmentCard key={env.id} environment={env} onEdit={() => openEditDialog(env)} onDelete={() => setDeleteEnv(env)} onClone={() => handleCloneEnvironment(env)} />
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editEnv} onOpenChange={(open) => !open && setEditEnv(null)}>
        <DialogContent>
          <form onSubmit={handleEditEnvironment}>
            <DialogHeader>
              <DialogTitle>Edit Environment</DialogTitle>
              <DialogDescription>Update environment details. The key cannot be changed.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required disabled={isEditing} />
              </div>
              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button key={color} type="button" className={`h-8 w-8 rounded-full border-2 transition-all ${editForm.color === color ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: color }} onClick={() => setEditForm({ ...editForm, color })} disabled={isEditing} />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditEnv(null)} disabled={isEditing}>Cancel</Button>
              <Button type="submit" disabled={isEditing}>{isEditing ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={!!deleteEnv}
        onOpenChange={(open) => !open && setDeleteEnv(null)}
        title="Delete Environment"
        description={`Are you sure you want to delete "${deleteEnv?.name}"? This will delete all flag configurations for this environment.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteEnvironment}
      />
    </div>
  );
}

function EnvironmentCard({ environment, onEdit, onDelete, onClone }: { environment: Environment; onEdit: () => void; onDelete: () => void; onClone: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const copyApiKey = async () => {
    await navigator.clipboard.writeText(environment.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: environment.color || "#6366f1" }} />
            <div>
              <CardTitle className="text-base">{environment.name}</CardTitle>
              <CardDescription className="font-mono text-xs">{environment.key}</CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onClone}><Copy className="mr-2 h-4 w-4" />Clone</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">SDK API Key</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 text-xs bg-muted px-2 py-1 rounded font-mono truncate">
                {showApiKey ? environment.apiKey : "•".repeat(Math.min(environment.apiKey.length, 32))}
              </code>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyApiKey}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Created {new Date(environment.createdAt).toLocaleDateString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}
