import { Status } from "@/Enum/Status";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseReportStatus(status: string): Status {
    return Object.values(Status).includes(status as Status)
      ? (status as Status)
      : Status.draft;
  }
