import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { hasRole } from "@/lib/permissions";
import type { Role } from "@/lib/types";

export function RequireRole({
  roles,
  redirectTo = "/dashboard",
  children,
}: {
  roles: Role[];
  redirectTo?: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!hasRole(user, ...roles)) return <Navigate to={redirectTo} />;
  return <>{children}</>;
}
