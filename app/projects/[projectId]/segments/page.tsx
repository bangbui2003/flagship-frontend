"use client";

import { use, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, Users, Search, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/use-toast";
import { api, fetcher, type Segment, type Project } from "@/lib/api";

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

export default function SegmentsPage({
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
  const { data: segments, error, isLoading, mutate } = useSWR<Segment[]>(
    `/v1/projects/${projectId}/segments`,
    fetcher
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSegment, setNewSegment] = useState({
    key: "",
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [keyError, setKeyError] = useState<string | null>(null);

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate key
    const error = validateKey(newSegment.key);
    if (error) {
      setKeyError(error);
      return;
    }

    // Check for duplicate key
    if (segments?.some(s => s.key === newSegment.key)) {
      setKeyError("A segment with this key already exists");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.segments.create(projectId, newSegment);
      setNewSegment({ key: "", name: "", description: "" });
      setKeyError(null);
      setIsCreateOpen(false);
      mutate();
      toast({
        title: "Segment created",
        description: `${newSegment.name} has been created successfully.`,
      });
    } catch (err) {
      console.error("Failed to create segment:", err);
      toast({
        title: "Failed to create segment",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate key from name
  const handleNameChange = (name: string) => {
    const key = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    setNewSegment({ ...newSegment, name, key });
    setKeyError(null);
  };

  const handleKeyChange = (key: string) => {
    setNewSegment({ ...newSegment, key });
    setKeyError(validateKey(key));
  };

  const filteredSegments = segments?.filter(
    (segment) =>
      segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      segment.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="User Segments"
        description="Create reusable user groups for targeting"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project", href: `/projects/${projectId}` },
          { label: "Segments" },
        ]}
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Segment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateSegment}>
                <DialogHeader>
                  <DialogTitle>Create Segment</DialogTitle>
                  <DialogDescription>
                    Create a new user segment for targeting rules.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Beta Users"
                      value={newSegment.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="key">Key</Label>
                    <Input
                      id="key"
                      placeholder="beta-users"
                      value={newSegment.key}
                      onChange={(e) => handleKeyChange(e.target.value)}
                      required
                      className={`font-mono ${keyError ? "border-destructive" : ""}`}
                    />
                    {keyError ? (
                      <p className="text-xs text-destructive">{keyError}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Unique identifier for this segment.
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Users enrolled in the beta program"
                      value={newSegment.description}
                      onChange={(e) =>
                        setNewSegment({
                          ...newSegment,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !!keyError}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Creating..." : "Create Segment"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      
      <div className="flex-1 p-6 overflow-auto">

        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search segments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <p className="text-destructive">Failed to load segments.</p>
            </CardContent>
          </Card>
        ) : filteredSegments?.length === 0 ? (
          searchQuery ? (
            <EmptyState
              icon={Users}
              title="No segments found"
              description="Try a different search term"
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No segments yet"
              description="Create user segments to target specific groups."
              action={{
                label: "Create Segment",
                onClick: () => setIsCreateOpen(true),
              }}
            />
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSegments?.map((segment) => (
              <Link key={segment.id} href={`/projects/${projectId}/segments/${segment.id}`}>
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                          <Users className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {segment.name}
                          </CardTitle>
                          <CardDescription className="font-mono text-xs">
                            {segment.key}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {segment.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {segment.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {segment.userCount || 0} users
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Created{" "}
                        {new Date(segment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
