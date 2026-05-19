export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  projectId: string;
  key: string;
  name: string;
  color: string | null;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flag {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlagVariation {
  id: string;
  flagId: string;
  key: string;
  value: unknown;
  createdAt: string;
}

export interface FlagVersion {
  id: string;
  flagId: string;
  environmentId: string;
  version: number;
  isEnabled: boolean;
  compiled: unknown;
  createdAt: string;
}

export interface TargetingRuleCondition {
  attribute: string;
  op: string;
  values: unknown[];
}

export interface TargetingRuleRolloutItem {
  variationId: string;
  weight: number;
}

export interface TargetingRule {
  id: string;
  flagVersionId: string;
  orderIndex: number;
  condition: TargetingRuleCondition;
  rollout: TargetingRuleRolloutItem[];
  createdAt: string;
}

export interface SegmentRule {
  id: string;
  attribute: string;
  operator: string;
  value: string;
}

export interface Segment {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  rules?: SegmentRule[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  projectId: string;
  environmentId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  actor: string;
  diff: unknown;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "developer" | "product_manager" | "qa" | "viewer";
  createdAt?: string;
}

export interface Schedule {
  id: string;
  flagVersionId: string;
  action: "enable" | "disable" | "update_rollout";
  scheduledAt: string;
  executedAt: string | null;
  status: "pending" | "executed" | "cancelled";
  payload: Record<string, unknown>;
  createdAt: string;
  flag?: Flag;
  environment?: Environment;
}

// Generic fetcher for SWR
export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${url}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || "An error occurred");
  }
  return res.json();
};

// API client
export const api = {
  // Projects
  projects: {
    list: () => fetcher<Project[]>("/v1/projects"),
    get: (id: string) => fetcher<Project>(`/v1/projects/${id}`),
    create: async (data: { name: string; description?: string }) => {
      const res = await fetch(`${API_BASE_URL}/v1/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json() as Promise<Project>;
    },
    update: async (id: string, data: { name?: string; description?: string }) => {
      const res = await fetch(`${API_BASE_URL}/v1/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update project");
      return res.json() as Promise<Project>;
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/v1/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
    },
  },

  // Environments
  environments: {
    list: (projectId: string) =>
      fetcher<Environment[]>(`/v1/projects/${projectId}/environments`),
    get: (projectId: string, id: string) =>
      fetcher<Environment>(`/v1/projects/${projectId}/environments/${id}`),
    create: async (
      projectId: string,
      data: { key: string; name: string; color?: string }
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/environments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to create environment");
      return res.json() as Promise<Environment>;
    },
    update: async (
      projectId: string,
      id: string,
      data: { name?: string; color?: string }
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/environments/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to update environment");
      return res.json() as Promise<Environment>;
    },
    delete: async (projectId: string, id: string) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/environments/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete environment");
    },
    rotateKey: async (projectId: string, id: string) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/environments/${id}/rotate-key`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to rotate API key");
      return res.json() as Promise<Environment>;
    },
  },

  // Flags
  flags: {
    list: (projectId: string) =>
      fetcher<Flag[]>(`/v1/projects/${projectId}/flags`),
    get: (projectId: string, id: string) =>
      fetcher<Flag>(`/v1/projects/${projectId}/flags/${id}`),
    create: async (
      projectId: string,
      data: { key: string; name: string; description?: string }
    ) => {
      const res = await fetch(`${API_BASE_URL}/v1/projects/${projectId}/flags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create flag");
      return res.json() as Promise<Flag>;
    },
    update: async (
      projectId: string,
      id: string,
      data: { name?: string; description?: string; archived?: boolean }
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to update flag");
      return res.json() as Promise<Flag>;
    },
    delete: async (projectId: string, id: string) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete flag");
    },
  },

  // Flag Variations
  variations: {
    list: (projectId: string, flagId: string) =>
      fetcher<FlagVariation[]>(
        `/v1/projects/${projectId}/flags/${flagId}/variations`
      ),
    create: async (
      projectId: string,
      flagId: string,
      data: { key: string; value: unknown }
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${flagId}/variations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to create variation");
      return res.json() as Promise<FlagVariation>;
    },
    update: async (
      projectId: string,
      flagId: string,
      variationId: string,
      data: { key?: string; value?: unknown }
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${flagId}/variations/${variationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to update variation");
      return res.json() as Promise<FlagVariation>;
    },
    delete: async (projectId: string, flagId: string, variationId: string) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${flagId}/variations/${variationId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete variation");
    },
  },

  // Flag Versions
  versions: {
    list: (projectId: string, flagId: string, environmentId: string) =>
      fetcher<FlagVersion[]>(
        `/v1/projects/${projectId}/flags/${flagId}/environments/${environmentId}/versions`
      ),
    getLatest: (projectId: string, flagId: string, environmentId: string) =>
      fetcher<FlagVersion>(
        `/v1/projects/${projectId}/flags/${flagId}/environments/${environmentId}/versions/latest`
      ),
    create: async (
      projectId: string,
      flagId: string,
      environmentId: string,
      data: { isEnabled: boolean }
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${flagId}/environments/${environmentId}/versions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to create version");
      return res.json() as Promise<FlagVersion>;
    },
    toggle: async (
      projectId: string,
      flagId: string,
      environmentId: string,
      versionId: string,
      isEnabled: boolean
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${flagId}/environments/${environmentId}/versions/${versionId}/toggle`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isEnabled }),
        }
      );
      if (!res.ok) throw new Error("Failed to toggle version");
      return res.json() as Promise<FlagVersion>;
    },
  },

  // Targeting Rules
  rules: {
    list: (
      projectId: string,
      flagId: string,
      environmentId: string,
      versionId: string
    ) =>
      fetcher<TargetingRule[]>(
        `/v1/projects/${projectId}/flags/${flagId}/environments/${environmentId}/versions/${versionId}/rules`
      ),
    create: async (
      projectId: string,
      flagId: string,
      environmentId: string,
      versionId: string,
      data: { condition: unknown; rollout: unknown }
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${flagId}/environments/${environmentId}/versions/${versionId}/rules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to create rule");
      return res.json() as Promise<TargetingRule>;
    },
    update: async (
      projectId: string,
      flagId: string,
      environmentId: string,
      versionId: string,
      ruleId: string,
      data: { condition?: unknown; rollout?: unknown }
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${flagId}/environments/${environmentId}/versions/${versionId}/rules/${ruleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to update rule");
      return res.json() as Promise<TargetingRule>;
    },
    delete: async (
      projectId: string,
      flagId: string,
      environmentId: string,
      versionId: string,
      ruleId: string
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/flags/${flagId}/environments/${environmentId}/versions/${versionId}/rules/${ruleId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete rule");
    },
  },

  // Segments
  segments: {
    list: (projectId: string) =>
      fetcher<Segment[]>(`/v1/projects/${projectId}/segments`),
    get: (projectId: string, id: string) =>
      fetcher<Segment>(`/v1/projects/${projectId}/segments/${id}`),
    create: async (
      projectId: string,
      data: { key: string; name: string; description?: string }
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/segments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to create segment");
      return res.json() as Promise<Segment>;
    },
    update: async (
      projectId: string,
      id: string,
      data: { name?: string; description?: string; rules?: unknown }
    ) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/segments/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!res.ok) throw new Error("Failed to update segment");
      return res.json() as Promise<Segment>;
    },
    delete: async (projectId: string, id: string) => {
      const res = await fetch(
        `${API_BASE_URL}/v1/projects/${projectId}/segments/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete segment");
    },
  },

  // Audit Logs
  auditLogs: {
    list: (projectId: string, params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return fetcher<{ data: AuditLog[]; total: number }>(
        `/v1/projects/${projectId}/audit-logs${query}`
      );
    },
  },

  // Health
  health: {
    check: () => fetcher<{ status: string; timestamp: string }>("/health"),
    ready: () =>
      fetcher<{
        status: string;
        timestamp: string;
        checks: Record<string, { status: string; latency?: number }>;
      }>("/health/ready"),
  },

  // Auth / Users
  auth: {
    listUsers: async () => {
      const res = await fetch(`${API_BASE_URL}/v1/auth/users`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<User[]>;
    },
    updateUserRole: async (userId: string, role: string) => {
      const res = await fetch(`${API_BASE_URL}/v1/auth/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update user role");
      return res.json() as Promise<User>;
    },
    inviteUser: async (data: { email: string; name: string; role: string; password: string }) => {
      const res = await fetch(`${API_BASE_URL}/v1/auth/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to invite user" }));
        throw new Error(err.message || "Failed to invite user");
      }
      return res.json() as Promise<User>;
    },
    deactivateUser: async (userId: string) => {
      const res = await fetch(`${API_BASE_URL}/v1/auth/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove user");
    },
  },

  // Schedules
  schedules: {
    list: (projectId: string) =>
      fetcher<Schedule[]>(`/v1/projects/${projectId}/schedules`),
    create: async (projectId: string, data: { flagVersionId: string; action: string; scheduledAt: string }) => {
      const res = await fetch(`${API_BASE_URL}/v1/projects/${projectId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create schedule");
      return res.json() as Promise<Schedule>;
    },
    update: async (projectId: string, id: string, data: { action?: string; scheduledAt?: string }) => {
      const res = await fetch(`${API_BASE_URL}/v1/projects/${projectId}/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update schedule");
      return res.json() as Promise<Schedule>;
    },
    cancel: async (projectId: string, id: string) => {
      const res = await fetch(`${API_BASE_URL}/v1/projects/${projectId}/schedules/${id}/cancel`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to cancel schedule");
    },
    delete: async (projectId: string, id: string) => {
      const res = await fetch(`${API_BASE_URL}/v1/projects/${projectId}/schedules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete schedule");
    },
  },

  // Analytics
  analytics: {
    overview: (projectId: string, params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return fetcher<{
        totalEvaluations: number;
        uniqueUsers: number;
        activeFlags: number;
        avgEvaluationsPerUser: number;
      }>(`/v1/projects/${projectId}/analytics/overview${query}`);
    },
    flags: (projectId: string, params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return fetcher<Array<{
        flagKey: string;
        evaluationCount: number;
        uniqueUsers: number;
        variations: Array<{ variationKey: string; count: number; percentage: number }>;
      }>>(`/v1/projects/${projectId}/analytics/flags${query}`);
    },
    timeseries: (projectId: string, params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return fetcher<Array<{ bucket: string; evaluationCount: number; uniqueUsers: number }>>(
        `/v1/projects/${projectId}/analytics/timeseries${query}`
      );
    },
    users: (projectId: string, params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : "";
      return fetcher<Array<{ userKey: string; evaluationCount: number }>>(
        `/v1/projects/${projectId}/analytics/users${query}`
      );
    },
    export: async (projectId: string, params: Record<string, string>) => {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/v1/projects/${projectId}/analytics/export?${query}`);
      if (!res.ok) throw new Error("Failed to export analytics");
      return res.blob();
    },
  },
};
