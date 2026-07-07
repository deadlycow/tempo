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

// Reconciles the dual leader model. team_leader/admin are global leaders
// (matches the backend's project-scoping decision). employee-role
// leadership is project-scoped via ledProjectIds when a projectId is
// given, else "leads at least one project."
export function isLeaderOf(
  user: User | null | undefined,
  ledProjectIds: string[],
  projectId?: string,
): boolean {
  if (!user) return false;
  if (user.role === "team_leader" || user.role === "admin") return true;
  if (user.role !== "employee") return false;
  if (!projectId) return ledProjectIds.length > 0;
  return ledProjectIds.includes(projectId);
}
