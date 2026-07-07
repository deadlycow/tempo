import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";
import { FolderCog, UserMinus, UserPlus, Users } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateProjectRequest } from "@/types/requests/ProjectRequest";
import { createProject, assignLeader, removeLeader } from "@/services/projectService";
import { ProjectResponse } from "@/types/responses/ProjectResponse";
import { useProjects } from "@/hooks/useProjects";
import { useUsers } from "@/hooks/useUsers";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/project")({
  component: ProjectPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  startDate: z.date(),
  endDate: z.date().optional().or(z.literal(""))
})
  .refine(
    data => !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
    { message: "End date must be after start date", path: ["endDate"] }
  );

function ProjectPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const canAccess = user?.role === "admin" || user?.role === "team_leader" || user?.role === "project_manager";
  if (!canAccess) return <Navigate to="/dashboard" />;

  const canManage = user?.role === "admin" || user?.role === "project_manager";

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateProjectRequest>({ name: "", description: "", startDate: new Date(), endDate: new Date() });
  const [selectedLeader, setSelectedLeader] = useState<Record<string, string>>({});

  const { data: allProjects = [], isLoading } = useProjects();
  const { data: allUsers = [] } = useUsers();
  const assignableUsers = allUsers.filter((u) => u.role === "employee" || u.role === "team_leader");

  const today = new Date().toISOString().split("T")[0];

  const { mutate: doAssign } = useMutation({
    mutationFn: ({ projectId, leaderId }: { projectId: string; leaderId: string }) =>
      assignLeader(projectId, leaderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Team leader assigned");
    },
    onError: () => toast.error("Failed to assign team leader"),
  });

  const { mutate: doRemove } = useMutation({
    mutationFn: ({ projectId, leaderId }: { projectId: string; leaderId: string }) =>
      removeLeader(projectId, leaderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Team leader removed");
    },
    onError: () => toast.error("Failed to remove team leader"),
  });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      const response = await createProject(form);
      if (!response) {
        toast.error("Failed to create project");
        return;
      }
      toast.success(`Project ${form.name} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setForm({ name: "", description: "", startDate: new Date(), endDate: new Date() });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">Create and manage projects and their team leaders.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {canManage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderCog className="h-4 w-4" /> Create a new project
              </CardTitle>
              <CardDescription>Create a new project.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Title</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Project title"
                    required
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    min={today}
                    value={form.startDate?.toISOString().split("T")[0]}
                    onChange={(e) => setForm(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    min={today}
                    value={form.endDate?.toISOString().split("T")[0]}
                    onChange={(e) => setForm(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="A short description..."
                    maxLength={160}
                    autoComplete="off"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                    {submitting ? "Creating..." : "Create project"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className={canManage ? "" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderCog className="h-4 w-4" /> All projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton />
            ) : allProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              allProjects.map((project: ProjectResponse) => {
                const assignedIds = new Set(project.teamLeaders?.map((tl) => tl.leader.id) ?? []);
                const available = assignableUsers.filter((l) => !assignedIds.has(l.userId ?? ""));
                return (
                  <div key={project.id} className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {new Date(project.startDate).toISOString().split("T")[0]}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Users className="h-3 w-3" /> Team leaders
                      </p>
                      {(project.teamLeaders?.length ?? 0) === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No leaders assigned</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {project.teamLeaders?.map((tl) => (
                            <span
                              key={tl.leader.id}
                              className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-xs font-medium"
                            >
                              {tl.leader.name}
                              {canManage && (
                                <button
                                  onClick={() => doRemove({ projectId: project.id, leaderId: tl.leader.id })}
                                  className="ml-0.5 rounded-full text-muted-foreground hover:text-destructive"
                                  aria-label={`Remove ${tl.leader.name}`}
                                >
                                  <UserMinus className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {canManage && available.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <Select
                            value={selectedLeader[project.id] ?? ""}
                            onValueChange={(v) => setSelectedLeader((prev) => ({ ...prev, [project.id]: v }))}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="Add team leader..." />
                            </SelectTrigger>
                            <SelectContent>
                              {available.map((l) => (
                                <SelectItem key={l.userId} value={l.userId ?? ""}>
                                  {l.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={!selectedLeader[project.id]}
                            onClick={() => {
                              const leaderId = selectedLeader[project.id];
                              if (!leaderId) return;
                              doAssign({ projectId: project.id, leaderId });
                              setSelectedLeader((prev) => ({ ...prev, [project.id]: "" }));
                            }}
                          >
                            <UserPlus className="mr-1 h-3 w-3" /> Assign
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
