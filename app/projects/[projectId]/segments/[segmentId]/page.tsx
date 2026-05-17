"use client";

import { use, useState } from "react";
import useSWR from "swr";
import {
  Users,
  Plus,
  Trash2,
  Upload,
  Download,
  Search,
  UserPlus,
  UserMinus,
  Filter,
  Save,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/use-toast";
import { fetcher, API_BASE_URL, type Segment, type Project } from "@/lib/api";

interface SegmentUserInfo {
  userKey: string;
  attributes: Record<string, unknown>;
}

interface SegmentUsersResponse {
  segmentId: string;
  users: SegmentUserInfo[];
  total: number;
}

interface SegmentRule {
  id: string;
  attribute: string;
  operator: string;
  value: string;
}

const OPERATORS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "starts_with", label: "starts with" },
  { value: "ends_with", label: "ends with" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater than or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less than or equal" },
  { value: "in", label: "in list" },
  { value: "not_in", label: "not in list" },
  { value: "regex", label: "matches regex" },
];

const COMMON_ATTRIBUTES = ["email", "country", "plan", "age", "company", "role", "beta", "created_at"];


export default function SegmentDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; segmentId: string }>;
}) {
  const { projectId, segmentId } = use(params);
  const { toast } = useToast();

  const { data: project } = useSWR<Project>(`/v1/projects/${projectId}`, fetcher);
  const { data: segment, mutate: mutateSegment } = useSWR<Segment>(
    `/v1/projects/${projectId}/segments/${segmentId}`,
    fetcher
  );
  const { data: usersData, mutate: mutateUsers } = useSWR<SegmentUsersResponse>(
    `/v1/projects/${projectId}/segments/${segmentId}/users?limit=100`,
    fetcher
  );

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [newUserKey, setNewUserKey] = useState("");
  const [bulkUserKeys, setBulkUserKeys] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rules, setRules] = useState<SegmentRule[]>([]);
  const [rulesLoaded, setRulesLoaded] = useState(false);

  if (segment && !rulesLoaded) {
    const existingRules = segment.rules as SegmentRule[] | undefined;
    if (existingRules && Array.isArray(existingRules)) {
      setRules(existingRules);
    }
    setRulesLoaded(true);
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/v1/projects/${projectId}/segments/${segmentId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userKeys: [newUserKey] }),
      });
      setNewUserKey("");
      setIsAddOpen(false);
      mutateUsers();
      mutateSegment();
      toast({ title: "User added", description: `${newUserKey} has been added to the segment.`, variant: "success" });
    } catch (err) {
      console.error("Failed to add user:", err);
      toast({ title: "Error", description: "Failed to add user to segment.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const userKeys = bulkUserKeys.split("\n").map((k) => k.trim()).filter((k) => k.length > 0);
      await fetch(`${API_BASE_URL}/v1/projects/${projectId}/segments/${segmentId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userKeys }),
      });
      setBulkUserKeys("");
      setIsBulkAddOpen(false);
      mutateUsers();
      mutateSegment();
      toast({ title: "Users added", description: `${userKeys.length} users have been added to the segment.`, variant: "success" });
    } catch (err) {
      console.error("Failed to add users:", err);
      toast({ title: "Error", description: "Failed to add users to segment.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUsers = async () => {
    if (selectedUsers.length === 0) return;
    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/v1/projects/${projectId}/segments/${segmentId}/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userKeys: selectedUsers }),
      });
      const count = selectedUsers.length;
      setSelectedUsers([]);
      mutateUsers();
      mutateSegment();
      toast({ title: "Users removed", description: `${count} user(s) have been removed from the segment.`, variant: "success" });
    } catch (err) {
      console.error("Failed to remove users:", err);
      toast({ title: "Error", description: "Failed to remove users from segment.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!usersData?.users) return;
    const csv = usersData.users.map((u) => u.userKey).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${segment?.key || "segment"}-users.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export complete", description: "User list has been downloaded." });
  };

  const addRule = () => {
    const newRule: SegmentRule = { id: Date.now().toString(), attribute: "email", operator: "contains", value: "" };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, field: keyof SegmentRule, value: string) => {
    setRules(rules.map((rule) => (rule.id === id ? { ...rule, [field]: value } : rule)));
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  const saveRules = async () => {
    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/v1/projects/${projectId}/segments/${segmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      mutateSegment();
      toast({ title: "Rules saved", description: "Segment rules have been updated.", variant: "success" });
    } catch (err) {
      console.error("Failed to save rules:", err);
      toast({ title: "Error", description: "Failed to save segment rules.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = usersData?.users?.filter((user) => user.userKey.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.userKey));
    }
  };

  const toggleSelectUser = (userKey: string) => {
    if (selectedUsers.includes(userKey)) {
      setSelectedUsers(selectedUsers.filter((k) => k !== userKey));
    } else {
      setSelectedUsers([...selectedUsers, userKey]);
    }
  };


  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={segment?.name || "Segment"}
        description={segment?.description || undefined}
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project", href: `/projects/${projectId}` },
          { label: "Segments", href: `/projects/${projectId}/segments` },
          { label: segment?.name || "Segment" },
        ]}
        actions={
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {usersData?.total || 0} users
          </Badge>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
            <Users className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-mono">{segment?.key}</p>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Users</TabsTrigger>
            <TabsTrigger value="rules"><Filter className="mr-2 h-4 w-4" />Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Segment Users</CardTitle>
                    <CardDescription>Manage users in this segment manually</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="mr-2 h-4 w-4" />Export
                    </Button>
                    <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" />Bulk Add</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={handleBulkAdd}>
                          <DialogHeader>
                            <DialogTitle>Bulk Add Users</DialogTitle>
                            <DialogDescription>Add multiple users at once. Enter one user key per line.</DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Textarea placeholder="user-1&#10;user-2&#10;user-3" value={bulkUserKeys} onChange={(e) => setBulkUserKeys(e.target.value)} rows={10} className="font-mono" />
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}><UserPlus className="mr-2 h-4 w-4" />{isSubmitting ? "Adding..." : "Add Users"}</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add User</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={handleAddUser}>
                          <DialogHeader>
                            <DialogTitle>Add User to Segment</DialogTitle>
                            <DialogDescription>Enter the user key to add to this segment.</DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label htmlFor="userKey">User Key</Label>
                            <Input id="userKey" placeholder="user-123" value={newUserKey} onChange={(e) => setNewUserKey(e.target.value)} className="font-mono mt-2" required />
                          </div>
                          <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adding..." : "Add User"}</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                  </div>
                  {selectedUsers.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleRemoveUsers} disabled={isSubmitting}>
                      <UserMinus className="mr-2 h-4 w-4" />Remove {selectedUsers.length} user{selectedUsers.length > 1 ? "s" : ""}
                    </Button>
                  )}
                </div>
                {!filteredUsers.length ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No users in this segment</p>
                    <p className="text-sm">Add users to start targeting them</p>
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} onCheckedChange={toggleSelectAll} />
                          </TableHead>
                          <TableHead>User Key</TableHead>
                          <TableHead>Attributes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.userKey}>
                            <TableCell><Checkbox checked={selectedUsers.includes(user.userKey)} onCheckedChange={() => toggleSelectUser(user.userKey)} /></TableCell>
                            <TableCell className="font-mono">{user.userKey}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {Object.keys(user.attributes).length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(user.attributes).slice(0, 3).map(([key, value]) => (
                                    <Badge key={key} variant="outline" className="text-xs">{key}: {String(value)}</Badge>
                                  ))}
                                  {Object.keys(user.attributes).length > 3 && <Badge variant="outline" className="text-xs">+{Object.keys(user.attributes).length - 3} more</Badge>}
                                </div>
                              ) : (<span className="text-xs italic">No attributes</span>)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Segment Rules</CardTitle>
                    <CardDescription>Define rules to automatically include users based on their attributes. Users matching ALL rules will be included.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={addRule}><Plus className="mr-2 h-4 w-4" />Add Rule</Button>
                    <Button size="sm" onClick={saveRules} disabled={isSubmitting}><Save className="mr-2 h-4 w-4" />{isSubmitting ? "Saving..." : "Save Rules"}</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {rules.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No rules defined</p>
                    <p className="text-sm mb-4">Add rules to automatically include users based on attributes</p>
                    <Button variant="outline" onClick={addRule}><Plus className="mr-2 h-4 w-4" />Add First Rule</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rules.map((rule, index) => (
                      <div key={rule.id} className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[60px]">
                          {index === 0 ? <Badge variant="secondary">IF</Badge> : <Badge variant="outline">AND</Badge>}
                        </div>
                        <Select value={rule.attribute} onValueChange={(v) => updateRule(rule.id, "attribute", v)}>
                          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Attribute" /></SelectTrigger>
                          <SelectContent>
                            {COMMON_ATTRIBUTES.map((attr) => (<SelectItem key={attr} value={attr}>{attr}</SelectItem>))}
                            <SelectItem value="custom">Custom attribute...</SelectItem>
                          </SelectContent>
                        </Select>
                        {rule.attribute === "custom" && (
                          <Input placeholder="attribute_name" className="w-[150px]" onChange={(e) => updateRule(rule.id, "attribute", e.target.value)} />
                        )}
                        <Select value={rule.operator} onValueChange={(v) => updateRule(rule.id, "operator", v)}>
                          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Operator" /></SelectTrigger>
                          <SelectContent>
                            {OPERATORS.map((op) => (<SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder={rule.operator === "in" || rule.operator === "not_in" ? "value1, value2, value3" : "Value"}
                          value={rule.value}
                          onChange={(e) => updateRule(rule.id, "value", e.target.value)}
                          className="flex-1"
                        />
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Rule Preview</p>
                      <p className="text-sm text-muted-foreground">Users will be included in this segment if they match <strong>all</strong> of the following conditions:</p>
                      <ul className="mt-2 space-y-1">
                        {rules.map((rule, index) => (
                          <li key={rule.id} className="text-sm font-mono text-muted-foreground">
                            {index > 0 && "AND "}{rule.attribute} {OPERATORS.find((o) => o.value === rule.operator)?.label || rule.operator} &quot;{rule.value}&quot;
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
