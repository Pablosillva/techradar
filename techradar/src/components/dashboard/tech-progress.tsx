import Link from "next/link";
import { Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TechProgress } from "@/lib/dashboard/helpers";

interface TechProgressPanelProps {
  items: TechProgress[];
}

export function TechProgressPanel({ items }: TechProgressPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Cpu className="h-4 w-4 text-violet-300" />
          Progresso por Tecnologia
        </CardTitle>
        <p className="text-[11px] text-slate-500">Calculado a partir dos itens do seu roadmap</p>
      </CardHeader>

      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">
            Adicione itens com o nome da tecnologia no título para acompanhar o progresso.{" "}
            <Link href="/roadmap" className="text-cyan-300 hover:underline">
              Ir para o roadmap
            </Link>
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((tech) => (
              <div key={tech.name} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                      style={{
                        color: tech.color,
                        backgroundColor: `${tech.color}1a`,
                      }}
                    >
                      {tech.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="truncate text-sm text-slate-300">{tech.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{tech.percent}%</span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="progress-bar h-full rounded-full transition-all"
                    style={{
                      width: `${tech.percent}%`,
                      backgroundColor: tech.color,
                      boxShadow: `0 0 12px ${tech.color}66`,
                    }}
                  />
                </div>

                <p className="text-[10px] text-slate-600">
                  {tech.completed} de {tech.total} itens concluídos
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
