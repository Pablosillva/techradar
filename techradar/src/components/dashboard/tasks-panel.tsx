import Link from "next/link";
import { CalendarClock, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMinutes } from "@/lib/dashboard/helpers";
import type { DashboardTask } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface TasksPanelProps {
  tasks: DashboardTask[];
}

const STATUS_VARIANT = {
  NEEDS_REVIEW: "warning",
  IN_PROGRESS: "default",
  NOT_STARTED: "secondary",
  COMPLETED: "success",
} as const;

export function TasksPanel({ tasks }: TasksPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CalendarClock className="h-4 w-4 text-cyan-300" />
          Próximas Tarefas
        </CardTitle>
        <Link href="/roadmap" className="text-[11px] font-medium text-cyan-300 hover:text-cyan-200">
          Ver roadmap →
        </Link>
      </CardHeader>

      <CardContent className="space-y-1.5 pt-0">
        {tasks.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-500">
            Nenhuma tarefa pendente. Seu roadmap está concluído! 🎉
          </p>
        ) : (
          tasks.map((task) => (
            <Link
              key={task.id}
              href="/roadmap"
              className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5 transition-colors hover:border-cyan-400/20 hover:bg-white/[0.04]"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  task.status === "COMPLETED"
                    ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-300"
                    : "border-slate-600"
                )}
                aria-hidden="true"
              >
                {task.status === "COMPLETED" && <Check className="h-3 w-3" />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">{task.title}</p>
                <p className="truncate text-[10px] text-slate-500">
                  {task.roadmap}
                  {task.estimatedMinutes ? ` • ~${formatMinutes(task.estimatedMinutes)}` : ""}
                </p>
              </div>

              <Badge variant={STATUS_VARIANT[task.status as keyof typeof STATUS_VARIANT] ?? "secondary"}>
                {task.statusLabel}
              </Badge>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
