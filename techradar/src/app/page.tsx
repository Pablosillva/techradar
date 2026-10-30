import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

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
  };
  return (
    <Card className={cn("p-4", colorMap[color])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10">
          <Icon className="w-5 h-5" />
        </div>
      </div>
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
    { name: "TypeScript", pct: 55, color: "bg-blue-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo, {name}!</h1>
          <p className="mt-1 text-sm text-gray-400">
            Grandes conquistas são feitas de pequenos avanços diários.{" "}
            <span className="text-yellow-400">🚀</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-gray-400 hover:text-white">
          Ver todas as métricas
        </Button>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Horas Hoje"
          value="2.5h"
          subtitle="Meta diária: 4h"
          trend="+0.5h"
          trendLabel="acima da meta"
          icon={({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        />
        <StatCard
          title="Sequência"
          value="7 dias"
          subtitle="Recorde: 12 dias"
          trend="+1"
          trendLabel="dia"
          color="orange"
          icon={({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        />
        <StatCard
          title="Metas"
          value="68%"
          subtitle="5 de 7 concluídas"
          trend="+12%"
          trendLabel="esta semana"
          color="purple"
          icon={({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          )}
        />
        <StatCard
          title="Revisões Pendentes"
          value={String(pendingReviews)}
          subtitle="Próxima: TypeScript (hoje)"
          trend="+3"
          trendLabel="novas"
          color="pink"
          icon={({ className }: { className?: string }) => (
            <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-8">
          {/* Evolução dos Estudos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">
                Evolução dos Estudos
              </CardTitle>
              <p className="text-xs text-gray-500">Últimos 30 dias</p>
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

          {/* Progresso por Tecnologia */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">
                Progresso por Tecnologia
              </CardTitle>
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
                      <div
                        className={`h-full ${t.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${t.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Próximas Tarefas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">
                Próximas Tarefas
              </CardTitle>
              <Link href="/tarefas" className="text-xs text-blue-400 hover:text-blue-300">
                Ver todas →
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3">
                {[
                  { t: "Assistir aula: React - Props & State", p: "Alta", h: "Hoje • 19:00" },
                  { t: "Fazer exercício: CRUD (PostgreSQL)", p: "Alta", h: "Hoje • 21:00" },
                  { t: "Revisar TypeScript - Interfaces", p: "Média", h: "Amanhã • 09:00" },
                  { t: "Projeto: Sistema de Ordens de Serviço", p: "Média", h: "Amanhã • 14:00" },
                  { t: "Ler capítulo: Clean Code (livro)", p: "Baixa", h: "Sáb. • 10:00" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-300">{item.t}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{item.p}</Badge>
                      <span className="text-[10px] text-gray-500">{item.h}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita (sidebar do dashboard) */}
        <div className="space-y-8">
          {/* Recomendação de Hoje */}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20V7m-5 10v2a3 3 0 005.356 1.857M7 20v-2m5.356-1.857L7 20m4.356-3.143L7 16m4.356 4.857L7 20" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Recomendação de Hoje</p>
                </div>
              </div>
              <button className="text-[10px] text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Continue com TypeScript</p>
                <p className="mt-1 text-xs text-gray-400">
                  Você está com 55% de progresso. Hoje é um bom dia para revisar
                  interfaces, types e funções genéricas.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="mt-4 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-medium py-2.5 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
              asChild
            >
              <Link href="/flashcards">Ir para o estudo <ArrowRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </Card>

          {/* Revisões Vencidas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">
                Revisões Vencidas
              </CardTitle>
              <Badge variant="outline">{pendingReviews}</Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3">
                {[
                  { t: "React - Hooks", r: "Revisão 4 • 3 dias atrasada", p: "Alta" },
                  { t: "TypeScript - Interfaces", r: "Revisão 3 • 2 dias atrasada", p: "Alta" },
                  { t: "Node.js - Express", r: "Revisão 2 • 1 dia atrasada", p: "Média" },
                  { t: "PostgreSQL - CRUD", r: "Revisão 1 • 1 dia atrasada", p: "Média" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-900/30 border border-gray-800/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-600" />
                      <span className="text-sm text-gray-300">{item.t}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-red-400">{item.r}</span>
                      <Badge variant="outline">{item.p}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Estatísticas Rápidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">
                Estatísticas Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Exercícios Resolvidos
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative w-full h-6 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "80%" }} />
                    </div>
                    <span className="text-sm font-bold text-white">80%</span>
                  </div>
                  <span className="text-[10px] text-green-400 mt-1">+80%</span>
                </div>
                <div className="flex flex-col border-l border-gray-800 pl-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Taxa de Acerto
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative w-full h-6 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: "92%" }} />
                    </div>
                    <span className="text-sm font-bold text-white">92%</span>
                  </div>
                  <span className="text-[10px] text-green-400 mt-1">+5% esta semana</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Última Atividade */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-300">
                Última Atividade
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {[
                  { t: "Hoje • 18:24", d: "Concluiu o exercício: CRUD com PostgreSQL", done: true },
                  { t: "Ontem • 20:10", d: "Revisou: TypeScript - Interfaces", done: true },
                  { t: "2 dias atrás • 15:00", d: "Assistiu: React - Props & State", done: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-900/30 border border-gray-800/50">
                    <div className={`w-2 h-2 rounded-full ${item.done ? "bg-green-500" : "bg-gray-600"}`} />
                    <div className="text-sm text-gray-300">{item.d}</div>
                    <span className="text-[10px] text-gray-500">{item.t}</span>
                  </div>
                ))}
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

      {/* Projetos em Andamento */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-gray-300">
            Projetos em Andamento
          </CardTitle>
          <Link href="/projetos" className="text-xs text-blue-400 hover:text-blue-300">
            Ver todos →
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                t: "Sistema de Ordens de Serviço",
                s: "Full Stack • React + Node + PostgreSQL",
                p: 45,
                st: "Em desenvolvimento",
                stColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
              },
              {
                t: "Startup Builder",
                s: "Full Stack • React + Node + PostgreSQL",
                p: 20,
                st: "Planejamento",
                stColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
              },
              {
                t: "Portfólio Pessoal",
                s: "End-to-end • React + TypeScript",
                p: 80,
                st: "Em revisão",
                stColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
              },
            ].map((proj, i) => (
              <Card key={i} className="p-4 bg-gray-900/50 border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v1m-6 0a2 2 0 002-2v2a2 2 0 002 2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <Badge variant="outline">{proj.st}</Badge>
                </div>
                <p className="text-sm font-medium text-white mb-1">{proj.t}</p>
                <p className="text-xs text-gray-500 mb-3">{proj.s}</p>
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${proj.p}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>{proj.p}%</span>
                  <span>{proj.st}</span>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendário de Estudos */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold text-gray-300">
            Calendário de Estudos
          </CardTitle>
          <Link href="/calendario" className="text-xs text-blue-400 hover:text-blue-300">
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
                    "w-3 rounded-t-sm transition-all hover:h-8 duration-200",
                    isActive
                      ? "bg-blue-500"
                      : h > 15
                      ? "bg-blue-400/50"
                      : h > 10
                      ? "bg-blue-300/30"
                      : "bg-gray-800",
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
