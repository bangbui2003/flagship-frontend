"use client";

import { use, useState, useEffect } from "react";
import useSWR from "swr";
import {
  Shield,
  Trash2,
  UserPlus,
  Crown,
  Code,
  Eye,
  Settings,
  Loader2,
  AlertCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/ui/use-toast";
import { api, fetcher, type Project, type User } from "@/lib/api";

const ROLES = [
  {
    key: "admin",
    label: "Admin",
    description: "Full access to all project settings and features",
    icon: Crown,
    color: "text-yellow-500",
  },
  {
    key: "developer",
    label: "Developer",
    description: "Create and edit flags, view logs",
    icon: Code,
    color: "text-blue-500",
  },
  {
    key: "product_manager",
    label: "Product Manager",
    description: "Configure rollouts, manage segments",
    icon: Settings,
    color: "text-purple-500",
  },
  {
    key: "qa",
    label: "QA",
    description: "Toggle flags in test environments",
    icon: Shield,
    color: "text-green-500",
  },
  {
    key: "viewer",
    label: "Viewer",
    description: "Read-only access to flags and analytics",
    icon: Eye,
    color: "text-gray-500",
  },
];

export default function AccessControlPage({
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

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    email: "",
    name: "",
    password: "",
    role: "developer" as User["role"],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.auth.listUsers();
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await api.auth.inviteUser({
        email: newMember.email,
        name: newMember.name,
        password: newMember.password,
        role: newMember.role,
      });
      setUsers([...users, created]);
      setNewMember({ email: "", name: "", password: "", role: "developer" });
      setIsInviteOpen(false);
      toast({ title: "User created", description: `${created.name} has been added successfully.` });
    } catch (err) {
      toast({
        title: "Failed to create user",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: User["role"]) => {
    setUpdatingUserId(userId);
    try {
      await api.auth.updateUserRole(userId, newRole);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
    } catch (err) {
      console.error("Failed to update role:", err);
      toast({
        title: "Failed to update role",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from the platform? Their account will be deactivated.`)) return;
    setRemovingUserId(userId);
    try {
      await api.auth.deactivateUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
      toast({ title: "User removed", description: `${userName} has been deactivated.` });
    } catch (err) {
      toast({
        title: "Failed to remove user",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  const getRoleInfo = (roleKey: string) => {
    return ROLES.find((r) => r.key === roleKey) || ROLES[4];
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Access Control"
        description="Manage team members and their permissions"
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: project?.name || "Project", href: `/projects/${projectId}` },
          { label: "Settings", href: `/projects/${projectId}/settings` },
          { label: "Access Control" },
        ]}
        actions={
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleInvite}>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join this project
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Jane Smith"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Temporary Password</Label>
                    <Input
                      type="password"
                      placeholder="Min. 8 characters"
                      value={newMember.password}
                      onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">The user can change this after logging in.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Role</Label>
                    <Select
                      value={newMember.role}
                      onValueChange={(v: User["role"]) => setNewMember({ ...newMember, role: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role.key} value={role.key}>
                            <div className="flex items-center gap-2">
                              <role.icon className={`h-4 w-4 ${role.color}`} />
                              {role.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {getRoleInfo(newMember.role).description}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Roles Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Role Permissions</CardTitle>
            <CardDescription>
              Overview of what each role can do
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ROLES.map((role) => (
                <div
                  key={role.key}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted`}
                  >
                    <role.icon className={`h-5 w-5 ${role.color}`} />
                  </div>
                  <div>
                    <p className="font-medium">{role.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>
                  {users.length} member{users.length !== 1 ? "s" : ""} with
                  access to this project
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-destructive">{error}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Make sure you have admin permissions to view users.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {users.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Select
                          value={user.role}
                          onValueChange={(v: User["role"]) =>
                            handleRoleChange(user.id, v)
                          }
                          disabled={updatingUserId === user.id}
                        >
                          <SelectTrigger className="w-48">
                            <div className="flex items-center gap-2">
                              {updatingUserId === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <roleInfo.icon
                                  className={`h-4 w-4 ${roleInfo.color}`}
                                />
                              )}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role.key} value={role.key}>
                                <div className="flex items-center gap-2">
                                  <role.icon className={`h-4 w-4 ${role.color}`} />
                                  {role.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleRemove(user.id, user.name)}
                          disabled={
                            removingUserId === user.id ||
                            (user.role === "admin" && users.filter((u) => u.role === "admin").length === 1)
                          }
                        >
                          {removingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Note about RBAC */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Full RBAC (Role-Based Access Control) with
            environment-level permissions is planned for Phase 2. Currently,
            roles apply project-wide.
          </p>
        </div>
      </div>
    </div>
  );
}
