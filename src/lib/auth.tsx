import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "./types";

import { LoginRequest } from "@/types/requests/AuthRequest";
import * as authService from "@/services/authService";
import { UserResponse } from "@/types/responses/UserResponse";
import { me } from "@/services/userService"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: LoginRequest) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const userData: UserResponse = await me()

        setUser({
          id: userData.userId,
          name: userData.name ?? "No name",
          email: userData.email,
          role: userData.role
        })
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, []);

  const login = useCallback(async (request: LoginRequest) => {

    const response = await authService.login(request)
    if (!response) throw new Error("Login failed")

    const userData: UserResponse = await me()

    setUser({
      id: userData.userId,
      name: userData.name ?? "No name",
      email: userData.email,
      role: userData.role
    })
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, isAuthenticated: !!user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
