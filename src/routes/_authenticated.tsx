import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div>Loading... </div>
  }
  if (!isAuthenticated) return <Navigate to="/login" />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
