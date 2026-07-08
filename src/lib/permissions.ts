import type { User, Role } from "./types";
import type { ProjectResponse } from "@/types/responses/ProjectResponse";

export function hasRole(user: User | null | undefined, ...roles: Role[]): boolean {
  return !!user && roles.includes(user.role);
}

export function isAdmin(user: User | null | undefined): boolean {
  return hasRole(user, "admin");
}

export function canManageProjects(user: User | null | undefined): boolean {
  return hasRole(user, "admin", "project_manager");
}

// Roles a given actor is allowed to assign when creating/editing a user.
export function assignableRoles(actor: User | null | undefined): Role[] {
  if (hasRole(actor, "admin")) return ["employee", "team_leader", "project_manager"];
  if (hasRole(actor, "team_leader")) return ["employee"];
  return [];
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "team_leader":
      return "Team Leader";
    case "project_manager":
      return "Project Manager";
    default:
      return "Employee";
  }
}

// Derives which project IDs a user leads from the already-fetched project
// list (each project's teamLeaders array), instead of a backend field —
// avoids needing a backend change for project-scoped leader checks.
export function getLedProjectIds(
  projects: ProjectResponse[],
  userId: string | undefined,
): string[] {
  if (!userId) return [];
  return projects
    .filter((p) => p.teamLeaders?.some((tl) => tl.leader.id === userId))
    .map((p) => p.id);
}

// team_leader now requires an actual per-project ProjectLeader assignment to
// act on a specific project's reports (only admin is unconditional) — but
// team_leader keeps its coarse, role-based "is a leader-type user" status
// when no projectId is given, since nav visibility (e.g. the "Add User" link
// in AppLayout) and page-level access shouldn't depend on whether they
// happen to be assigned to a project yet; only the per-report action check
// (with a projectId) needs the real assignment.
export function isLeaderOf(
  user: User | null | undefined,
  ledProjectIds: string[],
  projectId?: string,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "team_leader" && user.role !== "employee") return false;
  if (!projectId) return user.role === "team_leader" || ledProjectIds.length > 0;
  return ledProjectIds.includes(projectId);
}

// Derives which project IDs a user manages (as project_manager) from the
// already-fetched project list's projectManagers array — mirrors
// getLedProjectIds.
export function getManagedProjectIds(
  projects: ProjectResponse[],
  userId: string | undefined,
): string[] {
  if (!userId) return [];
  return projects
    .filter((p) => p.projectManagers?.some((pm) => pm.manager.id === userId))
    .map((p) => p.id);
}

// project_manager has no other privilege riding on this flag (unlike
// team_leader's "Add User" access), so a plain unconditional-except-admin
// check works in both the coarse and per-project modes.
export function isManagerOf(
  user: User | null | undefined,
  managedProjectIds: string[],
  projectId?: string,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role !== "project_manager") return false;
  if (!projectId) return managedProjectIds.length > 0;
  return managedProjectIds.includes(projectId);
}
