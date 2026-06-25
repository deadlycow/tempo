import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) { return <div>Loading... </div> }
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />;
}
