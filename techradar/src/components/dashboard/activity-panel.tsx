import { Activity, BookOpen, Code2, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";
import type { DashboardActivity } from "@/lib/dashboard";

const ICONS = {
  study: BookOpen,
  code: Code2,
  note: FileText,
} as const;

const COLORS = {
  study: "bg-cyan-400/10 text-cyan-300",
  code: "bg-violet-400/10 text-violet-300",
  note: "bg-emerald-400/10 text-emerald-300",
} as const;

interface ActivityPanelProps {
  activity: DashboardActivity[];
}

export function ActivityPanel({ activity }: ActivityPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-emerald-300" />
          Última Atividade
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-1 pt-0">
        {activity.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-500">
            Nenhuma atividade registrada ainda. Comece uma sessão de estudo.
          </p>
        ) : (
          activity.map((item) => {
            const Icon = ICONS[item.kind];
            return (
              <div key={item.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-white/[0.02]">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${COLORS[item.kind]}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">{item.title}</p>
                  <p className="text-[10px] text-slate-500">{item.detail}</p>
                </div>
                <span className="shrink-0 text-[10px] text-slate-600">{timeAgo(item.date)}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
