import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Clock, Target, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: string;
  trendLabel?: string;
  color?: string;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = "blue" }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-500/20",
    orange: "border-orange-500/20",
    purple: "border-purple-500/20",
    pink: "border-pink-500/20",
    green: "border-green-500/20",
    cyan: "border-cyan-500/20",
  };

  return (
    <Card className="p-4 rounded-xl">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 text-white">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-end gap-1">
          <span className="text-2xl font-bold text-white">{value}</span>
          <span className="text-xs text-gray-400">{trend?.startsWith("+") ? trend : "+" + trend}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{subtitle}</p>
      {trend && trendLabel && (
        <div className="mt-3 flex items-center gap-1">
          <span className={`text-[10px] font-medium ${trend.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
            {trend}
          </span>
          <span className="text-[10px] text-gray-500">{trendLabel}</span>
        </div>
      )}
    </Card>
  );
}

interface ProgressCardProps {
  title: string;
  pct: number;
  color: string;
}

function ProgressCard({ title, pct, color }: ProgressCardProps) {
  return (
    <Card className="p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
        <span className="text-sm font-bold text-white">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full ${color} rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  );
}

interface TaskCardProps {
  t: string;
  p: string;
  h: string;
}

function TaskCard({ t, p, h }: TaskCardProps) {
  return (
    <li className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-800">
      <div className="flex items-center gap-3">
        <input type="checkbox" className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500" />
        <span className="text-sm text-gray-300">{t}</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline">{p}</Badge>
        <span className="text-[10px] text-gray-500">{h}</span>
      </div>
    </li>
  );
}

interface ProjectCardProps {
  t: string;
  s: string;
  p: number;
  st: string;
  stColor: string;
}

function ProjectCard({ t, s, p, st, stColor }: ProjectCardProps) {
  return (
    <Card className="p-4 bg-gray-900/50 border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v1m-6 0a2 2 0 002-2v2a2 2 0 002 2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <Badge variant="outline">{st}</Badge>
      </div>
      <p className="text-sm font-medium text-white mb-1">{t}</p>
      <p className="text-xs text-gray-500 mb-3">{s}</p>
      <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500">
        <span>{p}%</span>
        <span>{st}</span>
      </div>
    </Card>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const userId = session.user.id as string;

  const [pendingReviews] = await Promise.all([
    prisma.flashcard.count({
      where: { userId, dueDate: { lte: new Date() } },
    }),
  ]);

  const name = session.user.name?.split(" ")[0] ?? "Pablo";

  const techProgress = [
    { name: "React", pct: 65, color: "bg-blue-500" },
    { name: "Node.js", pct: 45, color: "bg-emerald-500" },
    { name: "PostgreSQL", pct: 30, color: "bg-violet-500" },
    { name: "TypeScript", pct: 55, color: "bg-blue-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo, {name}!</h1>
          <p className="mt-1 text-sm text-gray-400">
            Grandes conquistas são feitas de pequenos avanços diários.{" "}
            <span className="text-yellow-400">🚀</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="text-gray-400 hover:text-white border-gray-700">
            Ver todas as métricas
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            Nova tarefa
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Horas Hoje"
          value="2.5h"
          subtitle="Meta diária: 4h"
          icon={Clock}
          trend="+0.5h"
          trendLabel="acima da meta"
          color="blue"
        />
        <StatCard
          title="Sequência"
          value="7 dias"
          subtitle="Recorde: 12 dias"
          icon={Clock}
          trend="+1"
          trendLabel="dia"
          color="orange"
        />
        <StatCard
          title="Metas"
          value="68%"
          subtitle="5 de 7 concluídas"
          icon={Target}
          trend="+12%"
          trendLabel="esta semana"
          color="purple"
        />
        <StatCard
          title="Revisões Pendentes"
          value={String(pendingReviews)}
          subtitle="Próxima: TypeScript (hoje)"
          icon={RefreshCw}
          trend="+3"
          trendLabel="novas"
          color="pink"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Evolution Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">Evolução dos Estudos</CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">Últimos 30 dias</p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64 w-full relative">
                <svg
                  className="w-full h-full text-blue-500"
                  viewBox="0 0 700 300"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 20 240 Q 80 200 140 180 T 260 160 T 380 190 T 500 140 T 620 110 L 680 240 L 20 240 Z"
                    fill="url(#areaGrad)"
                  />
                  <path
                    d="M 20 240 Q 80 200 140 180 T 260 160 T 380 190 T 500 140 T 620 110"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    fill="none"
                  />
                  <line x1="20" y1="240" x2="680" y2="240" stroke="#334155" strokeWidth="1" />
                  <line x1="20" y1="240" x2="20" y2="40" stroke="#334155" strokeWidth="1" />
                  {[8, 6, 4, 2, 0].map((v) => {
                    const y = 240 - (v / 8) * 200;
                    return (
                      <line
                        key={v}
                        x1={16}
                        y1={y}
                        x2={20}
                        y2={y}
                        stroke="#475569"
                        strokeWidth="1"
                      />
                    );
                  })}
                </svg>
                <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                  <span>29/09</span>
                  <span>02/10</span>
                  <span>05/10</span>
                  <span>08/10</span>
                  <span>11/10</span>
                  <span>14/10</span>
                  <span>17/10</span>
                  <span>20/10</span>
                  <span>23/10</span>
                  <span>26/10</span>
                  <span>28/10</span>
                </div>
                <div className="absolute top-0 right-4 bg-gray-900 border border-gray-700 px-2 py-1 rounded text-[10px] text-white">
                  5.2h
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">Próximas Tarefas</CardTitle>
              <Link href="/tarefas" className="text-xs text-blue-400 hover:text-blue-300 underline">
                Ver todas →
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                <TaskCard
                  t="Assistir aula: React - Props & State"
                  p="Alta"
                  h="Hoje • 19:00"
                />
                <TaskCard
                  t="Fazer exercício: CRUD (PostgreSQL)"
                  p="Alta"
                  h="Hoje • 21:00"
                />
                <TaskCard
                  t="Revisar TypeScript - Interfaces"
                  p="Média"
                  h="Amanhã • 09:00"
                />
                <TaskCard
                  t="Projeto: Sistema de Ordens de Serviço"
                  p="Média"
                  h="Amanhã • 14:00"
                />
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Progress by Technology */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">Progresso por Tecnologia</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {techProgress.map((t) => (
                  <div key={t.name} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center">
                          {t.name === "React" && <span className="text-[10px] text-white">⚛</span>}
                          {t.name === "Node.js" && <span className="text-[10px] text-white">N</span>}
                          {t.name === "PostgreSQL" && <span className="text-[10px] text-white">DB</span>}
                          {t.name === "TypeScript" && <span className="text-[10px] text-white">TS</span>}
                        </div>
                        <span className="text-sm text-gray-300">{t.name}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{t.pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${t.color} rounded-full transition-all duration-1000`} style={{ width: `${t.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Reviews */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">Revisões Vencidas</CardTitle>
              <Badge variant="outline">{pendingReviews}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                <TaskCard t="React - Hooks" p="Alta" h="Revisão 4 • 3 dias atrasada" />
                <TaskCard t="TypeScript - Interfaces" p="Alta" h="Revisão 3 • 2 dias atrasada" />
                <TaskCard t="Node.js - Express" p="Média" h="Revisão 2 • 1 dia atrasada" />
                <TaskCard t="PostgreSQL - CRUD" p="Média" h="Revisão 1 • 1 dia atrasada" />
              </ul>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">Estatísticas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <ProgressCard title="Exercícios Resolvidos" pct={80} color="bg-blue-500" />
                <ProgressCard title="Taxa de Acerto" pct={92} color="bg-purple-500" />
              </div>
            </CardContent>
          </Card>

          {/* Last Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">Última Atividade</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-900/30 border border-gray-800/50">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="text-sm text-gray-300">Concluiu o exercício: CRUD com PostgreSQL</div>
                  <span className="text-[10px] text-gray-500">Hoje • 18:24</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-900/30 border border-gray-800/50">
                  <div className="w-2 h-2 rounded-full bg-gray-600" />
                  <div className="text-sm text-gray-300">Revisou: TypeScript - Interfaces</div>
                  <span className="text-[10px] text-gray-500">Ontem • 20:10</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-900/30 border border-gray-800/50">
                  <div className="w-2 h-2 rounded-full bg-gray-600" />
                  <div className="text-sm text-gray-300">Assistiu: React - Props & State</div>
                  <span className="text-[10px] text-gray-500">2 dias atrás • 15:00</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <Link href="/historico" className="text-[10px] text-blue-400 flex items-center gap-1">
                  Ver histórico completo <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Projects Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-gray-300">Projetos em Andamento</CardTitle>
          <Link href="/projetos" className="text-xs text-blue-400 hover:text-blue-300 underline">
            Ver todos →
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProjectCard
              t="Sistema de Ordens de Serviço"
              s="Full Stack • React + Node + PostgreSQL"
              p={45}
              st="Em desenvolvimento"
              stColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
            />
            <ProjectCard
              t="Startup Builder"
              s="Full Stack • React + Node + PostgreSQL"
              p={20}
              st="Planejamento"
              stColor="bg-purple-500/10 text-purple-400 border-purple-500/20"
            />
            <ProjectCard
              t="Portfólio Pessoal"
              s="End-to-end • React + TypeScript"
              p={80}
              st="Em revisão"
              stColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Study Calendar */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-gray-300">Calendário de Estudos</CardTitle>
          <Link href="/calendario" className="text-xs text-blue-400 hover:text-blue-300 underline">
            Ver todos →
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-end gap-1 h-48">
            {[...Array(30)].map((_, i) => {
              const h = 8 + Math.floor(Math.random() * 30);
              const isActive = h > 20;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-3 rounded-t-sm transition-all hover:h-8 duration-300",
                    isActive ? "bg-blue-500" : h > 15 ? "bg-blue-400/50" : h > 10 ? "bg-blue-300/30" : "bg-gray-800",
                    "hover:bg-blue-400"
                  )}
                  style={{ height: `${h}px` }}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-3">
            <span>Set 2025</span>
            <span>Out 2025</span>
            <span>Nov 2025</span>
          </div>
          <div className="flex justify-between text-[9px] text-gray-500 mt-1">
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 mt-2">
            <span>0h</span>
            <span>2h</span>
            <span>4h</span>
            <span>6h</span>
            <span>8h+</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
