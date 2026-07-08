import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { UserMinus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequireRole } from "@/components/RequireRole";
import { roleLabel } from "@/lib/permissions";
import type { Role } from "@/lib/types";
import { useUsers, useUpdateUserRole } from "@/hooks/useUsers";
import { useProjects } from "@/hooks/useProjects";
import { useReports } from "@/hooks/useReports";
import { Status } from "@/Enum/Status";
import { assignLeader, removeLeader } from "@/services/projectService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

const ROLE_OPTIONS: Role[] = ["employee", "team_leader", "project_manager", "admin"];

function UsersPage() {
  return (
    <RequireRole roles={["admin"]}>
      <UsersPageContent />
    </RequireRole>
  );
}

function UsersPageContent() {
  const { data: apiUsers = [] } = useUsers();
  const { data: projects = [] } = useProjects();
  const { data: allReports = [] } = useReports();
  const queryClient = useQueryClient();

  const [pendingProjectByUser, setPendingProjectByUser] = useState<Record<string, string>>({});
  const [pendingRemoval, setPendingRemoval] = useState<{ projectId: string; projectName: string; leaderId: string; reportCount: number } | null>(null);

  const adminCount = useMemo(() => apiUsers.filter((u) => u.role === "admin").length, [apiUsers]);

  const { mutate: changeRole } = useUpdateUserRole();

  const { mutate: doAssign } = useMutation({
    mutationFn: ({ projectId, leaderId }: { projectId: string; leaderId: string }) =>
      assignLeader(projectId, leaderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Assigned as project leader");
    },
    onError: () => toast.error("Failed to assign project leader"),
  });

  const { mutate: doRemove } = useMutation({
    mutationFn: ({ projectId, leaderId }: { projectId: string; leaderId: string }) =>
      removeLeader(projectId, leaderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Removed as project leader");
    },
    onError: () => toast.error("Failed to remove project leader"),
  });

  const ledProjectsByUser = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    for (const project of projects) {
      for (const tl of project.teamLeaders ?? []) {
        const list = map.get(tl.leader.id) ?? [];
        list.push({ id: project.id, name: project.name });
        map.set(tl.leader.id, list);
      }
    }
    return map;
  }, [projects]);

  const handleRemoveLeaderClick = (projectId: string, projectName: string, leaderId: string) => {
    const project = projects.find((p) => p.id === projectId);
    const isLastLeader = (project?.teamLeaders?.length ?? 0) <= 1;
    const reportCount = allReports.filter(
      (r) => r.projectId === projectId && r.status === Status.submitted
    ).length;
    if (isLastLeader && reportCount > 0) {
      setPendingRemoval({ projectId, projectName, leaderId, reportCount });
      return;
    }
    doRemove({ projectId, leaderId });
  };

  const handleRoleChange = (userId: string, role: Role) => {
    changeRole(
      { userId, role },
      {
        onSuccess: () => toast.success("Role updated"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update role"),
      }
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manage users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Change a user's role or their project-leader assignments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> All users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {apiUsers.map((u) => {
            const isLastAdmin = u.role === "admin" && adminCount <= 1;
            const ledProjects = ledProjectsByUser.get(u.userId ?? "") ?? [];
            const pendingProjectId = pendingProjectByUser[u.userId ?? ""] ?? "";
            const canBeAssignedAsLeader = u.role === "employee" || u.role === "team_leader";
            const assignableProjects = canBeAssignedAsLeader
              ? projects.filter((p) => !ledProjects.some((lp) => lp.id === p.id))
              : [];

            return (
              <div key={u.userId} className="rounded-lg border bg-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Select
                    value={u.role}
                    disabled={isLastAdmin}
                    onValueChange={(v) => handleRoleChange(u.userId ?? "", v as Role)}
                  >
                    <SelectTrigger className="w-44" title={isLastAdmin ? "At least one admin must remain" : undefined}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabel(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {ledProjects.map((p) => (
                    <span
                      key={p.id}
                      className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {p.name}
                      <button
                        onClick={() => handleRemoveLeaderClick(p.id, p.name, u.userId ?? "")}
                        aria-label={`Remove leadership of ${p.name}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <UserMinus className="h-3 w-3" />
                      </button>
                    </span>
                  ))}

                  {assignableProjects.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={pendingProjectId}
                        onValueChange={(v) =>
                          setPendingProjectByUser((prev) => ({ ...prev, [u.userId ?? ""]: v }))
                        }
                      >
                        <SelectTrigger className="h-8 w-40 text-xs">
                          <SelectValue placeholder="Lead a project..." />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableProjects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!pendingProjectId}
                        onClick={() => {
                          doAssign({ projectId: pendingProjectId, leaderId: u.userId ?? "" });
                          setPendingProjectByUser((prev) => ({ ...prev, [u.userId ?? ""]: "" }));
                        }}
                      >
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Assign
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!pendingRemoval} onOpenChange={(o) => !o && setPendingRemoval(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove leadership of {pendingRemoval?.projectName}?</DialogTitle>
            <DialogDescription>
              This project has {pendingRemoval?.reportCount} report{pendingRemoval?.reportCount === 1 ? "" : "s"} awaiting
              approval and no other leader — only admins and team leaders will be able to approve them until someone
              new is assigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemoval(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!pendingRemoval) return;
                doRemove({ projectId: pendingRemoval.projectId, leaderId: pendingRemoval.leaderId });
                setPendingRemoval(null);
              }}
            >
              Remove anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
