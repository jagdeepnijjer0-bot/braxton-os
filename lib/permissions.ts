/**
 * Permission system for Braxton OS.
 *
 * Role hierarchy (highest → lowest):
 *   admin > manager > sales > va > member > contractor > investor > viewer
 *
 * "member" is the legacy catch-all role and maps to general team access.
 */

export type AppRole =
  | "admin"
  | "manager"
  | "sales"
  | "va"
  | "member"
  | "contractor"
  | "investor"
  | "viewer";

const ROLE_LEVEL: Record<AppRole, number> = {
  admin:      7,
  manager:    6,
  sales:      5,
  va:         4,
  member:     4, // same level as VA — general team member
  contractor: 2,
  investor:   1,
  viewer:     0,
};

export function roleLevel(role: string): number {
  return ROLE_LEVEL[role as AppRole] ?? 0;
}

export function hasRole(userRole: string, minRole: AppRole): boolean {
  return roleLevel(userRole) >= roleLevel(minRole);
}

// ── Resource-level permissions ────────────────────────────────────────────────

export type Resource =
  | "contacts"
  | "deals"
  | "projects"
  | "finance"
  | "inbox"
  | "tasks"
  | "outreach"
  | "files"
  | "settings"
  | "team";

export type Action = "read" | "write" | "delete" | "admin";

const PERMISSIONS: Record<AppRole, Partial<Record<Resource, Action[]>>> = {
  admin: {
    contacts:  ["read", "write", "delete", "admin"],
    deals:     ["read", "write", "delete", "admin"],
    projects:  ["read", "write", "delete", "admin"],
    finance:   ["read", "write", "delete", "admin"],
    inbox:     ["read", "write", "delete", "admin"],
    tasks:     ["read", "write", "delete", "admin"],
    outreach:  ["read", "write", "delete", "admin"],
    files:     ["read", "write", "delete", "admin"],
    settings:  ["read", "write", "delete", "admin"],
    team:      ["read", "write", "delete", "admin"],
  },
  manager: {
    contacts:  ["read", "write", "delete"],
    deals:     ["read", "write", "delete"],
    projects:  ["read", "write", "delete"],
    finance:   ["read", "write"],
    inbox:     ["read", "write", "delete"],
    tasks:     ["read", "write", "delete"],
    outreach:  ["read", "write"],
    files:     ["read", "write", "delete"],
    settings:  ["read"],
    team:      ["read"],
  },
  sales: {
    contacts:  ["read", "write", "delete"],
    deals:     ["read", "write"],
    projects:  ["read"],
    finance:   ["read"],
    inbox:     ["read", "write"],
    tasks:     ["read", "write"],
    outreach:  ["read", "write"],
    files:     ["read", "write"],
    settings:  [],
    team:      [],
  },
  va: {
    contacts:  ["read", "write"],
    deals:     ["read"],
    projects:  ["read"],
    finance:   ["read"],
    inbox:     ["read", "write"],
    tasks:     ["read", "write"],
    outreach:  ["read"],
    files:     ["read", "write"],
    settings:  [],
    team:      [],
  },
  member: {
    contacts:  ["read", "write"],
    deals:     ["read", "write"],
    projects:  ["read", "write"],
    finance:   ["read"],
    inbox:     ["read", "write"],
    tasks:     ["read", "write"],
    outreach:  ["read"],
    files:     ["read", "write"],
    settings:  [],
    team:      [],
  },
  contractor: {
    contacts:  [],
    deals:     [],
    projects:  ["read"],          // own projects only (enforced by RLS)
    finance:   [],
    inbox:     [],
    tasks:     ["read", "write"], // own tasks only
    outreach:  [],
    files:     ["read", "write"], // project files only
    settings:  [],
    team:      [],
  },
  investor: {
    contacts:  [],
    deals:     ["read"],          // assigned deals only (RLS)
    projects:  ["read"],          // linked projects only
    finance:   [],
    inbox:     [],
    tasks:     [],
    outreach:  [],
    files:     ["read"],
    settings:  [],
    team:      [],
  },
  viewer: {
    contacts:  ["read"],
    deals:     ["read"],
    projects:  ["read"],
    finance:   ["read"],
    inbox:     ["read"],
    tasks:     ["read"],
    outreach:  ["read"],
    files:     ["read"],
    settings:  [],
    team:      [],
  },
};

export function can(
  userRole: string,
  resource: Resource,
  action: Action,
): boolean {
  const perms = PERMISSIONS[userRole as AppRole];
  if (!perms) return false;
  return perms[resource]?.includes(action) ?? false;
}

// Convenience: check write access (write OR admin)
export function canWrite(userRole: string, resource: Resource): boolean {
  return can(userRole, resource, "write") || can(userRole, resource, "admin");
}

// Convenience: check delete access
export function canDelete(userRole: string, resource: Resource): boolean {
  return can(userRole, resource, "delete") || can(userRole, resource, "admin");
}

// Role display labels
export const ROLE_LABELS: Record<AppRole, string> = {
  admin:      "Admin",
  manager:    "Manager",
  sales:      "Sales",
  va:         "VA",
  member:     "Member",
  contractor: "Contractor",
  investor:   "Investor",
  viewer:     "Viewer",
};

export const ALL_ROLES = Object.keys(ROLE_LABELS) as AppRole[];
