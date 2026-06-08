import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";
import { FolderCog } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateProjectRequest } from "@/types/requests/ProjectRequest";
import { createProject, getAllProjects } from "@/services/projectService";
import { ProjectResponse } from "@/types/responses/ProjectResponse";
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
    {
      message: "End date must be after start date",
      path: ["endDate"]
    }
  );

function ProjectPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient()

  const canAccess = user?.role === "admin" || user?.role === "team_leader" || user?.role === "project_manager";
  if (!canAccess) return <Navigate to="/dashboard" />;

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CreateProjectRequest>({ name: "", description: "", startDate: new Date(), endDate: new Date() })

  const { data: allProjects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects
  })

  const today = new Date().toISOString().split("T")[0]

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      const response = await createProject(form)
      if (!response)
        toast.error(`Failed to create project`)

    } finally {
      toast.success(`Project ${form.name} created successfully!`)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setSubmitting(false);
      setForm({ name: "", description: "", startDate: new Date(), endDate: new Date() })
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Create or manage projects.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {(user?.role === "admin" || user?.role === "project_manager") && (
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
                  <Label htmlFor="team">Start date</Label>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderCog className="h-4 w-4" /> Projects
            </CardTitle>
            <CardDescription className="flex justify-between px-3 border-b pb-2">
              <div>
                All projects.
              </div>
              <div>
                Start date.
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton />
            ) : (
              allProjects.map((u: ProjectResponse) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.description}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {new Date(u.startDate).toISOString().split("T")[0]}
                  </span>
                </div>
              )))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
