import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { seedReports, users as seedUsers, projects as seedProjects } from "./mock-data";
import type { Project, ReportStatus, Role, User, WeeklyReport } from "./types";

interface DataState {
  users: User[];
  projects: Project[];
  reports: WeeklyReport[];
  addUser: (input: { name: string; email: string; role: Role; team?: string }) => User;
  upsertReport: (r: WeeklyReport) => void;
  setReportStatus: (id: string, status: ReportStatus, opts?: { feedback?: string; reviewedBy?: string }) => void;
  bulkSetStatus: (ids: string[], status: ReportStatus, reviewedBy?: string) => void;
  getUserById: (id: string) => User | undefined;
  getProjectById: (id: string) => Project | undefined;
}

const DataContext = createContext<DataState | null>(null);
const STORAGE_KEY = "tr_reports_v1";
const USERS_KEY = "tr_users_v1";

export function DataProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<WeeklyReport[]>(() => {
    if (typeof window === "undefined") return seedReports;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { }
    return seedReports;
  });

  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window === "undefined") return seedUsers;
    try {
      const raw = window.localStorage.getItem(USERS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { }
    return seedUsers;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  const addUser = useCallback<DataState["addUser"]>((input) => {
    const newUser: User = {
      id: `u_${Date.now().toString(36)}`,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      team: input.team?.trim() || undefined,
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  }, []);

  const upsertReport = useCallback((r: WeeklyReport) => {
    setReports((prev) => {
      const idx = prev.findIndex((p) => p.id === r.id);
      if (idx === -1) return [...prev, r];
      const next = [...prev];
      next[idx] = r;
      return next;
    });
  }, []);

  const setReportStatus = useCallback<DataState["setReportStatus"]>((id, status, opts) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const now = new Date().toISOString();
        return {
          ...r,
          status,
          ...(status === "submitted" && { submittedAt: now }),
          ...(status === "verified" && { verifiedAt: now, reviewedBy: opts?.reviewedBy ?? r.reviewedBy }),
          ...(status === "rejected" && { rejectedAt: now, feedback: opts?.feedback, reviewedBy: opts?.reviewedBy ?? r.reviewedBy }),
          ...(status === "sent" && { sentAt: now }),
        };
      })
    );
  }, []);

  const bulkSetStatus = useCallback<DataState["bulkSetStatus"]>((ids, status, reviewedBy) => {
    setReports((prev) =>
      prev.map((r) => {
        if (!ids.includes(r.id)) return r;
        const now = new Date().toISOString();
        return {
          ...r,
          status,
          ...(status === "sent" && { sentAt: now }),
          ...(status === "verified" && { verifiedAt: now, reviewedBy }),
        };
      })
    );
  }, []);

  const value = useMemo<DataState>(
    () => ({
      users,
      projects: seedProjects,
      reports,
      addUser,
      upsertReport,
      setReportStatus,
      bulkSetStatus,
      getUserById: (id) => users.find((u) => u.id === id),
      getProjectById: (id) => seedProjects.find((p) => p.id === id),
    }),
    [users, reports, addUser, upsertReport, setReportStatus, bulkSetStatus]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}
