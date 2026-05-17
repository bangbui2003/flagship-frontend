"use client";

import { use, useState } from "react";
import useSWR from "swr";
import {
  Flag,
  Plus,
  Trash2,
  GripVertical,
  Users,
  Percent,
  Target,
  Settings,
  Code,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import {
  api,
  fetcher,
  API_BASE_URL,
  type Flag as FlagType,
  type Environment,
  type FlagVersion,
  type FlagVariation,
  type Project,
  type TargetingRule,
} from "@/lib/api";


export default function FlagDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; flagId: string }>;
}) {
  const { projectId, flagId } = use(params);

  const { data: project } = useSWR<Project>(
    `/v1/projects/${projectId}`,
    fetcher
  );
  const { data: flag } = useSWR<FlagType>(
    `/v1/projects/${projectId}/flags/${flagId}`,
    fetcher
  );
  const { data: environments } = useSWR<Environment[]>(
    `/v1/projects/${projectId}/environments`,
    fetcher
  );
  const { data: variations, mutate: mutateVariations } = useSWR<FlagVariation[]>(
    `/v1/projects/${projectId}/flags/${flagId}/variations`,
    fetcher
  );

  const [selectedEnvId, setSelectedEnvId] = useState<string>("");

  if (environments?.length && !selectedEnvId) {
    setSelectedEnvId(environments[0].id);
  }

  const selectedEnv = environments?.find((e) => e.id === selectedEnvId);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={flag?.name || "Flag Details"}
        description={flag?.description || undefined}
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project", href: `/projects/${projectId}` },
          { label: "Flags", href: `/projects/${projectId}/flags` },
          { label: flag?.name || "Flag" },
        ]}
        actions={
          <Select value={selectedEnvId} onValueChange={setSelectedEnvId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
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
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Flag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-mono">{flag?.key}</p>
          </div>
        </div>

        <Tabs defaultValue="targeting" className="space-y-6">
          <TabsList>
            <TabsTrigger value="targeting">
              <Target className="mr-2 h-4 w-4" />
              Targeting
            </TabsTrigger>
            <TabsTrigger value="variations">
              <Settings className="mr-2 h-4 w-4" />
              Variations
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="mr-2 h-4 w-4" />
              Code Examples
            </TabsTrigger>
          </TabsList>

          <TabsContent value="targeting">
            {selectedEnv && (
              <TargetingTab
                projectId={projectId}
                flagId={flagId}
                environment={selectedEnv}
                variations={variations || []}
              />
            )}
          </TabsContent>

          <TabsContent value="variations">
            <VariationsTab
              projectId={projectId}
              flagId={flagId}
              variations={variations || []}
              onMutate={mutateVariations}
            />
          </TabsContent>

          <TabsContent value="code">
            <CodeExamplesTab
              flagKey={flag?.key || ""}
              apiKey={selectedEnv?.apiKey || ""}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


function TargetingTab({
  projectId,
  flagId,
  environment,
  variations,
}: {
  projectId: string;
  flagId: string;
  environment: Environment;
  variations: FlagVariation[];
}) {
  const { data: version, mutate } = useSWR<FlagVersion & { targetingRules?: TargetingRule[] }>(
    `/v1/projects/${projectId}/flags/${flagId}/environments/${environment.id}/versions/latest`,
    fetcher
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(100);
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      if (version?.id) {
        await api.versions.toggle(projectId, flagId, environment.id, version.id, !version.isEnabled);
      } else {
        await api.versions.create(projectId, flagId, environment.id, { isEnabled: true });
      }
      mutate();
    } catch (err) {
      console.error("Failed to toggle flag:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveRollout = async () => {
    if (!version?.id) return;
    setIsUpdating(true);
    try {
      const catchAllRule = (version as FlagVersion & { targetingRules?: TargetingRule[] }).targetingRules?.find(
        (r) => r.condition?.attribute === "key" && r.condition?.operator === "regex" && r.condition?.value === ".*"
      );
      const ruleData = {
        condition: { attribute: "key", operator: "regex", value: ".*" },
        rollout: { percentage: rolloutPercentage },
      };
      if (catchAllRule) {
        await api.rules.update(projectId, flagId, environment.id, version.id, catchAllRule.id, ruleData);
      } else {
        await api.rules.create(projectId, flagId, environment.id, version.id, ruleData);
      }
      mutate();
    } catch (err) {
      console.error("Failed to save rollout:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Flag Status</CardTitle>
          <CardDescription>Control whether this flag is enabled in {environment.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${version?.isEnabled ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="font-medium">{version?.isEnabled ? "Enabled" : "Disabled"}</span>
            </div>
            <Switch checked={version?.isEnabled ?? false} onCheckedChange={handleToggle} disabled={isUpdating} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Percentage Rollout
          </CardTitle>
          <CardDescription>Gradually roll out this feature to a percentage of users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rollout percentage</span>
              <span className="text-2xl font-bold">{rolloutPercentage}%</span>
            </div>
            <Slider value={[rolloutPercentage]} onValueChange={([value]) => setRolloutPercentage(value)} max={100} step={1} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {rolloutPercentage === 100 ? "All users will see this feature" : rolloutPercentage === 0 ? "No users will see this feature" : `Approximately ${rolloutPercentage}% of users will see this feature`}
            </span>
          </div>
          <Button onClick={handleSaveRollout} disabled={isUpdating}>Save Rollout</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Targeting Rules
              </CardTitle>
              <CardDescription>Define rules to target specific users or segments</CardDescription>
            </div>
            <Dialog open={isAddRuleOpen} onOpenChange={setIsAddRuleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Targeting Rule</DialogTitle>
                  <DialogDescription>Create a rule to target specific users</DialogDescription>
                </DialogHeader>
                <AddRuleForm
                  projectId={projectId}
                  flagId={flagId}
                  environmentId={environment.id}
                  versionId={version?.id}
                  variations={variations}
                  onSuccess={() => { setIsAddRuleOpen(false); mutate(); }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {version?.targetingRules?.length ? (
            <div className="space-y-3">
              {version.targetingRules.sort((a, b) => a.orderIndex - b.orderIndex).map((rule, index) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  index={index}
                  variations={variations}
                  onDelete={async () => {
                    if (!version?.id) return;
                    await api.rules.delete(projectId, flagId, environment.id, version.id, rule.id);
                    mutate();
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No targeting rules yet</p>
              <p className="text-sm">Add rules to target specific users or segments</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


function RuleCard({ rule, index, variations, onDelete }: { rule: TargetingRule; index: number; variations: FlagVariation[]; onDelete: () => Promise<void> }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const condition = rule.condition;
  const rollout = rule.rollout;

  const formatCondition = (cond: any): string => {
    if (cond.and) return cond.and.map(formatCondition).join(" AND ");
    if (cond.or) return cond.or.map(formatCondition).join(" OR ");
    return `${cond.attribute} ${cond.operator} ${JSON.stringify(cond.value)}`;
  };

  const formatRollout = (roll: any): string => {
    if (roll.percentage !== undefined) return `${roll.percentage}% of users`;
    if (roll.variationKey) return `Serve "${roll.variationKey}"`;
    if (roll.weights) return roll.weights.map((w: any) => `${w.weight}% → ${w.variationKey}`).join(", ");
    return "Default";
  };

  return (
    <div className="flex items-start gap-3 p-4 border rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground">
        <GripVertical className="h-4 w-4 cursor-grab" />
        <span className="text-sm font-medium">#{index + 1}</span>
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">IF</Badge>
          <code className="text-sm bg-muted px-2 py-1 rounded">{formatCondition(condition)}</code>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">THEN</Badge>
          <span className="text-sm">{formatRollout(rollout)}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive"
        disabled={isDeleting}
        onClick={async () => {
          setIsDeleting(true);
          try { await onDelete(); } finally { setIsDeleting(false); }
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function AddRuleForm({
  projectId, flagId, environmentId, versionId, variations, onSuccess,
}: {
  projectId: string; flagId: string; environmentId: string; versionId?: string; variations: FlagVariation[]; onSuccess: () => void;
}) {
  const [attribute, setAttribute] = useState("email");
  const [operator, setOperator] = useState("contains");
  const [value, setValue] = useState("");
  const [rolloutType, setRolloutType] = useState<"variation" | "percentage">("variation");
  const [selectedVariation, setSelectedVariation] = useState("");
  const [percentage, setPercentage] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionId) return;
    setIsSubmitting(true);
    try {
      const ruleData = {
        condition: { attribute, operator, value },
        rollout: rolloutType === "variation" ? { variationKey: selectedVariation } : { percentage },
      };
      await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${flagId}/environments/${environmentId}/versions/${versionId}/rules`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ruleData) }
      );
      onSuccess();
    } catch (err) {
      console.error("Failed to create rule:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <Label>Condition</Label>
        <div className="grid grid-cols-3 gap-2">
          <Select value={attribute} onValueChange={setAttribute}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="key">User Key</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="country">Country</SelectItem>
              <SelectItem value="plan">Plan</SelectItem>
              <SelectItem value="beta">Beta User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={operator} onValueChange={setOperator}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="eq">equals</SelectItem>
              <SelectItem value="neq">not equals</SelectItem>
              <SelectItem value="contains">contains</SelectItem>
              <SelectItem value="startsWith">starts with</SelectItem>
              <SelectItem value="endsWith">ends with</SelectItem>
              <SelectItem value="in">in list</SelectItem>
              <SelectItem value="regex">matches regex</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
      </div>
      <div className="space-y-4">
        <Label>Then serve</Label>
        <Select value={rolloutType} onValueChange={(v) => setRolloutType(v as any)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="variation">Specific variation</SelectItem>
            <SelectItem value="percentage">Percentage rollout</SelectItem>
          </SelectContent>
        </Select>
        {rolloutType === "variation" ? (
          <Select value={selectedVariation} onValueChange={setSelectedVariation}>
            <SelectTrigger><SelectValue placeholder="Select variation" /></SelectTrigger>
            <SelectContent>
              {variations.map((v) => (<SelectItem key={v.id} value={v.key}>{v.key}</SelectItem>))}
              {variations.length === 0 && <SelectItem value="true" disabled>No variations (create some first)</SelectItem>}
            </SelectContent>
          </Select>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm">{percentage}%</span></div>
            <Slider value={[percentage]} onValueChange={([v]) => setPercentage(v)} max={100} step={1} />
          </div>
        )}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Rule"}</Button>
      </DialogFooter>
    </form>
  );
}


function VariationsTab({
  projectId, flagId, variations, onMutate,
}: {
  projectId: string; flagId: string; variations: FlagVariation[]; onMutate: () => void;
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newVariation, setNewVariation] = useState({ key: "", value: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.variations.create(projectId, flagId, {
        key: newVariation.key,
        value: newVariation.value === "true" ? true : newVariation.value === "false" ? false : newVariation.value,
      });
      setNewVariation({ key: "", value: "" });
      setIsAddOpen(false);
      onMutate();
    } catch (err) {
      console.error("Failed to create variation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Variations</CardTitle>
            <CardDescription>Define the different values this flag can return</CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" />Add Variation</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Add Variation</DialogTitle>
                  <DialogDescription>Create a new variation for this flag</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Key</Label>
                    <Input placeholder="e.g., control, treatment-a" value={newVariation.key} onChange={(e) => setNewVariation({ ...newVariation, key: e.target.value })} required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Value</Label>
                    <Input placeholder="e.g., true, false, or any JSON" value={newVariation.value} onChange={(e) => setNewVariation({ ...newVariation, value: e.target.value })} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {variations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No variations yet</p>
            <p className="text-sm">Add variations to define different flag values</p>
          </div>
        ) : (
          <div className="space-y-3">
            {variations.map((variation) => (
              <div key={variation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{variation.key}</p>
                  <code className="text-sm text-muted-foreground">{JSON.stringify(variation.value)}</code>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  disabled={deletingId === variation.id}
                  onClick={async () => {
                    setDeletingId(variation.id);
                    try {
                      await api.variations.delete(projectId, flagId, variation.id);
                      onMutate();
                    } catch (err) {
                      console.error("Failed to delete variation:", err);
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CodeExamplesTab({ flagKey, apiKey }: { flagKey: string; apiKey: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Code Examples</CardTitle>
        <CardDescription>Use these code snippets to integrate this flag in your application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">JavaScript / TypeScript</h4>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`import { FlagshipClient } from '@flagship/js-sdk';

const client = new FlagshipClient({
  apiKey: '${apiKey || "your-api-key"}',
  baseUrl: '${API_BASE_URL}',
});

await client.initialize();

const user = {
  key: 'user-123',
  attributes: { email: 'user@example.com', plan: 'premium' },
};

const isEnabled = client.isEnabled('${flagKey}', user);

if (isEnabled) {
  // Show new feature
} else {
  // Show old feature
}`}</code>
          </pre>
        </div>
        <div>
          <h4 className="font-medium mb-2">React Hook</h4>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`import { useFlagship } from '@flagship/react-sdk';

function MyComponent() {
  const { isEnabled } = useFlagship();
  
  const showNewFeature = isEnabled('${flagKey}', {
    key: user.id,
    attributes: { plan: user.plan },
  });

  return showNewFeature ? <NewFeature /> : <OldFeature />;
}`}</code>
          </pre>
        </div>
        <div>
          <h4 className="font-medium mb-2">cURL (API)</h4>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
            <code>{`curl -X GET '${API_BASE_URL}/v1/sdk/config' \\
  -H 'X-API-Key: ${apiKey || "your-api-key"}'`}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
