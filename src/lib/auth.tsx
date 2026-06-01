import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { users } from "./mock-data";
import type { User } from "./types";
import { LoginRequest } from "@/types/requests/AuthRequst";
import { logIn } from "@/services/authService";
import { AuthResponse } from "@/types/responses/AuthResponse";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: LoginRequest) => Promise<AuthResponse>;
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

  const mockAuthResponse = (found: User): AuthResponse => {
    const role = "role" in found && typeof found.role === "string" ? found.role : "employee"
    return {
      accessToken: "demo",
      userId: found.id,
      email: found.email,
      userName: found.name,
      role,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }
  }

  const login = useCallback(async (user: LoginRequest): Promise<AuthResponse> => {
    const normalizedEmail = user.email.toLowerCase().trim()
    const found = users.find((u) => u.email.toLowerCase() === normalizedEmail)
    if (found){
      setUser(found)
      localStorage.setItem("token", "demo")
      return mockAuthResponse(found)
    }
    
    const response = await logIn(user)

    const apiUser: User = {
      id: response.userId,
      name: response.userName ?? "No name",
      email: response.email,
    }

    localStorage.setItem("token", response.accessToken)

    setUser(apiUser)

    return response
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
