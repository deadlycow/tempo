import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { users } from "./mock-data";
import type { User } from "./types";

import { LoginRequest } from "@/types/requests/AuthRequest";
import { logIn } from "@/services/authService";
import { UserResponse } from "@/types/responses/UserResponse";
import { me } from "@/services/userService"

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: LoginRequest) => Promise<UserResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const KEY = "tr_auth_user_v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) window.localStorage.setItem(KEY, JSON.stringify(user));
    else window.localStorage.removeItem(KEY);
  }, [user]);

  const mockAuthResponse = (found: User): UserResponse => {
    const role = "role" in found && typeof found.role === "string" ? found.role : "employee"
    return {
      email: found.email,
      name: found.name,
      role: role,
    }
  }

  const login = useCallback(async (user: LoginRequest): Promise<UserResponse> => {

    const normalizedEmail = user.email.toLowerCase().trim()
    const found = users.find((u) => u.email.toLowerCase() === normalizedEmail)
    if (found) {
      setUser(found)
      console.log("Using mock auth response for", found.role)
      return mockAuthResponse(found)
    }

    const response = await logIn(user)
    if (!response) throw new Error("Login failed")

    const userData: UserResponse = await me()
    
    const apiUser: User = {
      name: userData.name ?? "No name",
      email: userData.email,
      role: userData.role,
    }
    setUser(apiUser)

    return apiUser
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo<AuthState>(
    () => ({ user, isAuthenticated: !!user, login, logout }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
