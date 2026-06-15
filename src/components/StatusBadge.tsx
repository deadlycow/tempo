import { Status } from "@/Enum/Status";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, FileText, Send, XCircle } from "lucide-react";

const config: Record<Status, { label: string; cls: string; Icon: typeof Clock }> = {
  Draft: { label: "Draft", cls: "bg-muted text-muted-foreground border-border", Icon: FileText },
  Submitted: { label: "Submitted", cls: "bg-info/10 text-info border-info/30", Icon: Clock },
  Verified: { label: "Verified", cls: "bg-success/10 text-success border-success/30", Icon: CheckCircle2 },
  Rejected: { label: "Rejected", cls: "bg-destructive/10 text-destructive border-destructive/30", Icon: XCircle },
  Sent: { label: "Sent", cls: "bg-primary/10 text-primary border-primary/30", Icon: Send },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const c = config[status];
  const Icon = c.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        c.cls,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}
