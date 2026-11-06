"use client";

import {
  useState,
  useCallback,
  useMemo,
  Fragment,
} from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Map,
  BookOpen,
  FlaskConical,
  FileText,
  Code2,
  RefreshCw,
  TrendingUp,
  FolderKanban,
  Briefcase,
  Library,
  ListTodo,
  Settings,
  Code,
  GitBranch,
  Database,
  Atom,
  Cloud,
  ShieldAlert,
  Search,
  Bell,
  User,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   DADOS MOCKADOS
   ============================================================ */

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Roadmap", href: "/roadmap-dashboard", icon: Map, active: true },
  { name: "Caderno", href: "/caderno", icon: BookOpen },
  { name: "Laboratório", href: "/laboratorio", icon: FlaskConical },
  { name: "Conteúdo", href: "/conteudo", icon: FileText },
  { name: "Exercícios", href: "/treino", icon: Code2 },
  { name: "Revisões", href: "/flashcards", icon: RefreshCw },
  { name: "Evolução", href: "/evolucao", icon: TrendingUp },
  { name: "Projetos", href: "/projetos", icon: FolderKanban },
  { name: "Candidaturas", href: "/candidaturas", icon: Briefcase },
  { name: "Biblioteca", href: "/biblioteca", icon: Library },
  { name: "Tarefas", href: "/tarefas", icon: ListTodo },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

const TABS = [
  "Full-Stack Developer",
  "Frontend Engineer",
  "Backend Specialist",
  "DevOps/Cloud",
  "Mobile Developer",
];

type RoadmapStatus = "completo" | "andamento" | "bloqueado";

interface RoadmapNode {
  id: string;
  title: string;
  subtitle: string;
  status: RoadmapStatus;
  icon: React.ElementType;
  badge?: string;
  progress?: number; // 0-100
  checks: string[];
  bottomAction?: { label: string; variant: "outline" | "fill" };
}

const ROADMAP_NODES: RoadmapNode[] = [
  {
    id: "fundamentos",
    title: "Fundamentos de Web",
    subtitle: "Progresso de tarefa",
    status: "andamento",
    icon: Code,
    progress: 45,
    checks: ["Hooks", "Context API"],
    bottomAction: { label: "Começar", variant: "outline" },
  },
  {
    id: "git",
    title: "Git/Version Control",
    subtitle: "",
    status: "completo",
    icon: GitBranch,
    badge: "Completo",
    progress: 100,
    checks: ["Hooks", "Git/Version"],
    bottomAction: { label: "Ver detalhes", variant: "fill" },
  },
  {
    id: "react",
    title: "React & State Management",
    subtitle: "",
    status: "completo",
    icon: Atom,
    badge: "Completo",
    progress: 100,
    checks: ["Hooks", "Context API"],
    bottomAction: { label: "Completo", variant: "fill" },
  },
  {
    id: "node",
    title: "Node.js & Databases",
    subtitle: "",
    status: "andamento",
    icon: Database,
    badge: "Em Andamento",
    progress: 55,
    checks: ["Data model"],
    bottomAction: { label: "Project: Path", variant: "outline" },
  },
  {
    id: "sql",
    title: "Advanced SQL & Query Optimiz...",
    subtitle: "",
    status: "bloqueado",
    icon: Database,
    badge: "Bloqueado",
    progress: 0,
    checks: ["Database", "Schema view"],
    bottomAction: { label: "Completo", variant: "fill" },
  },
  {
    id: "testing",
    title: "Testing & Deployment",
    subtitle: "",
    status: "bloqueado",
    icon: Cloud,
    badge: "Bloqueado",
    progress: 0,
    checks: ["CI/CD", "Hosting"],
    bottomAction: { label: "Projects Lab", variant: "outline" },
  },
];

const DIFFICULTY_DATA = [
  { name: "Easy", value: 75, color: "#22c55e" },
  { name: "Medium", value: 50, color: "#06b6d4" },
  { name: "Hard", value: 30, color: "#a855f7" },
];

const MILESTONE_DATA = [
  { name: "Milestone 1", value: 75, color: "#22c55e" },
  { name: "Milestone 2", value: 50, color: "#06b6d4" },
  { name: "Milestone 3", value: 30, color: "#a855f7" },
];

const FILTER_GROUPS = [
  {
    title: "Difficulty",
    items: ["Iniciante", "Intermediário", "Avançado"],
  },
  {
    title: "Goal",
    items: ["Full-Stack", "Frontend", "Backend"],
  },
  {
    title: "Focus",
    items: ["React", "Node.js", "SQL"],
  },
  {
    title: "Job Applications",
    items: ["Vagas de Júnior", "Vagas de Pleno"],
  },
];

const NEXT_STEPS = [
  "Full-Stack Developer Path",
  "React & State Management",
  "Node.js & Databases",
  "Testing & Deployment",
];

/* ============================================================
   COMPONENTES AUXILIARES
   ============================================================ */

function NavItem({ item }: { item: (typeof NAV_ITEMS)[number] }) {
  const active = item.active;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-gradient-to-r from-cyan-400/15 via-cyan-400/[0.06] to-transparent text-white border border-cyan-400/20"
          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100 border-transparent",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors">
        <item.icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      </span>
      <span className="flex-1 truncate">{item.name}</span>
    </Link>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition-all border-b-2",
        active
          ? "text-cyan-400 border-cyan-400 bg-white/[0.03]"
          : "text-slate-400 border-transparent hover:text-slate-200",
      )}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: RoadmapStatus }) {
  const config: Record<RoadmapStatus, { label: string; color: string; dot: string }> = {
    completo: { label: "Completo", color: "#22c55e", dot: "bg-emerald-400" },
    andamento: { label: "Em Andamento", color: "#f59e0b", dot: "bg-amber-400" },
    bloqueado: { label: "Bloqueado", color: "#ef4444", dot: "bg-rose-500" },
  };
  const c = config[status];
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border">
      <span className="h-1.5 w-1.5 rounded-full {c.dot}"></span>
      <span className="text-slate-300">{c.label}</span>
    </div>
  );
}

function ProgressBar({ value, color = "cyan", className = "" }: { value: number; color?: string; className?: string }) {
  const colorMap: Record<string, string> = {
    cyan: "bg-gradient-to-r from-cyan-400 to-violet-500",
    green: "bg-gradient-to-r from-emerald-400 to-teal-400",
    amber: "bg-gradient-to-r from-amber-400 to-orange-400",
    rose: "bg-gradient-to-r from-rose-400 to-pink-400",
  };
  return (
    <div className={cn("w-full h-1.5 overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700 ease-out",
          colorMap[color] || colorMap.cyan,
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/* Donut chart puro SVG */
function DonutChart({ value, size = 110, thickness = 10 }: { value: number; size?: number; thickness?: number }) {
  const radius = (size - thickness) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * ((100 - value) / 100);

  return (
    <svg width={size} height={size} className="mx-auto">
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="white/[0.06]"
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="round"
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="url(#donutGradient)"
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out"
      />
      <defs>
        <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* Bar chart puro SVG */
function BarChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = 40;
  const gap = 24;
  const width = data.length * (barWidth + gap) + 20;
  const height = 140;

  return (
    <svg width={width} height={height} className="mx-auto">
      {data.map((d, i) => {
        const barHeight = (d.value / maxValue) * 90;
        const x = 40 + i * (barWidth + gap);
        const y = height - 30 - barHeight;
        return (
          <g key={d.name}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              fill={d.color}
              className="transition-all duration-500 hover:opacity-90"
            />
            <text
              x={x + barWidth / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
            >
              {d.name}
            </text>
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#e2e8f0"
            >
              {d.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   PÁGINA PRINCIPAL
   ============================================================ */

export default function RoadmapDashboardPage() {
  const [activeTab, setActiveTab] = useState<string>("Full-Stack Developer");
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({
    Difficulty: false,
    Goal: false,
    Focus: false,
    "Job Applications": false,
  });

  const totalProgress = useMemo(
    () =>
      Math.round(
        ROADMAP_NODES.reduce((acc, n) => acc + (n.progress ?? 0), 0) /
          ROADMAP_NODES.length,
      ),
    [],
  );

  const toggleFilter = useCallback((key: string) => {
    setOpenFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-300 selection:bg-cyan-400/30">
      {/* ============ SIDEBAR ESQUERDA ============ */}
      <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-[#0f172a]/80 backdrop-blur flex flex-col z-20">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950 shadow-[0_10px_24px_-10px_rgba(34,211,238,0.8)]">
            <Code className="h-5 w-5 strokeWidth={2.4}" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold leading-none tracking-tight">
              <span className="text-cyan-300">Dev</span>
              <span className="text-white">Path</span>
              <span className="text-violet-300">Hub</span>
            </span>
            <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Dashboard de Roadmap
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Navegação
          </p>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 p-[2px]">
              <img
                className="rounded-full bg-[#0f172a]"
                src="https://i.pravatar.cc/150?u=pablo"
                alt="Pablo Silva"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">Pablo Silva</p>
              <p className="text-xs text-slate-500 truncate">Desenvolvedor Full-Stack</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ============ CONTEÚDO PRINCIPAL ============ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 border-b border-white/[0.06] bg-[#0f172a]/80 backdrop-blur px-6 flex items-center justify-between">
          <div className="relative w-full md:w-[560px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg text-slate-400 hover:bg-white/[0.04] hover:text-white transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 p-[2px]">
              <img className="rounded-full bg-[#0f172a]" src="https://i.pravatar.cc/150?u=pablo" alt="Perfil" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto">
            {/* Título */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-white">Seu Roadmap de Desenvolvimento</h1>
              <p className="mt-1 text-sm text-slate-400">
                Acompanhe sua evolução por trilhas, tecnologias e marcos de estudo.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {TABS.map((tab) => (
                <Tab
                  key={tab}
                  label={tab}
                  active={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                />
              ))}
            </div>

            {/* Progresso geral */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">Progresso Geral da Trilha</h2>
                <span className="text-xs font-mono text-slate-500">{totalProgress}%</span>
              </div>
              <ProgressBar value={totalProgress} color="cyan" />
            </div>

            {/* Área do Roadmap com conexões SVG */}
            <div className="relative mb-8">
              <svg
                className="absolute inset-0 pointer-events-none w-full h-full"
                style={{ overflow: "visible" }}
              >
                {/* Linha horizontal principal brilhante */}
                <line
                  x1="120"
                  y1="280"
                  x2="720"
                  y2="280"
                  stroke="url(#mainGlow)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="mainGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
              </svg>

              <div className="relative grid grid-cols-2 gap-6">
                {/* Card inicial JS */}
                <div className="relative z-10 flex flex-col items-center py-8">
                  <div className="w-40 h-32 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                    <span className="text-5xl font-bold text-slate-950">JS</span>
                  </div>
                  <div className="mt-4 w-full max-w-xs px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
                    <h3 className="text-sm font-semibold text-white leading-tight">HTML/CSS/JS Fundamentals</h3>
                    <div className="mt-2 space-y-1 text-xs text-slate-400">
                      <div className="flex items-center justify-center gap-1">
                        <span className="w-3 h-3 rounded bg-white/[0.1]"></span> Hooks
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="w-3 h-3 rounded bg-white/[0.1]"></span> Context API
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Fundamentos */}
                <RoadmapCard node={ROADMAP_NODES[0]} connected />

                {/* Linhas verticais conexão */}
                <div className="hidden md:block absolute left-1/2 top-[240px] w-full -translate-x-1/2 pointer-events-none">
                  <svg className="w-full h-40" style={{ overflow: "visible" }}>
                    <line x1="50%" y1="0" x2="50%" y2="40" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" className="filter url(#glow)" />
                    <line x1="50%" y1="40" x2="35%" y2="40" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" className="filter url(#glow)" />
                  </svg>
                </div>
              </div>

              {/* Linha inferior com cards */}
              <div className="relative mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ROADMAP_NODES.slice(1).map((node, idx) => (
                  <RoadmapCard key={node.id} node={node} connected bottom />
                ))}

                {/* Conexões inferiores */}
                <div className="hidden md:block absolute -top-8 left-1/2 w-full -translate-x-1/2 pointer-events-none">
                  <svg className="w-full h-24" style={{ overflow: "visible" }}>
                    <line x1="0%" y1="0" x2="100%" y2="0" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" className="filter url(#glow)" />
                    {[0, 1, 2, 3].map((i) => (
                      <line
                        key={i}
                        x1={`${(i * 25 + 12.5)}%`}
                        y1="0"
                        x2={`${(i * 25 + 12.5)}%`}
                        y2="24"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="filter url(#glow)"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ============ PAINEL DE ESTATÍSTICAS (DIREITA) ============ */}
      <aside className="w-80 shrink-0 border-l border-white/[0.06] bg-[#0f172a]/80 backdrop-blur flex flex-col z-20">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-1">
            <Search className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Pesquisa Rápida em Notas</span>
          </div>
          <input
            type="text"
            placeholder="Buscar anotações..."
            className="w-full mt-2 h-9 pl-3 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.02] text-xs text-slate-200 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Your Learning Status */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Your Learning Status</h3>
            <div className="mb-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Milestone Progress</h4>
              <div className="flex items-center justify-center">
                <DonutChart value={75} size={100} thickness={10} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[75, 50, 30].map((v, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        i === 0 ? "bg-emerald-400" : i === 1 ? "bg-cyan-400" : "bg-violet-500",
                      )}
                    ></span>
                    <span className="text-[10px] text-slate-400">{v}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/[0.05] pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Top Tech for Path</h4>
              <BarChart data={DIFFICULTY_DATA} />
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-3">
            {FILTER_GROUPS.map((group) => {
              const isOpen = openFilters[group.title];
              return (
                <div key={group.title} className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
                  <button
                    onClick={() => toggleFilter(group.title)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {group.title}
                    </span>
                    <ChevronRight className={cn("h-3 w-3 text-slate-500 transition-transform", isOpen && "rotate-90")} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-white/[0.03] px-4 pb-3 space-y-1.5">
                      {group.items.map((item) => (
                        <label key={item} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="rounded border-white/[0.06] bg-white/[0.02] text-cyan-400 focus:ring-cyan-400"
                          />
                          <span className="text-xs text-slate-300">{item}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recommended Next Steps */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Recommended Next Steps</h4>
            <ul className="space-y-2">
              {NEXT_STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="rounded border-white/[0.06] bg-white/[0.02] text-cyan-400 focus:ring-cyan-400"
                  />
                  <span className="text-xs text-slate-300 truncate">{step}</span>
                  <ArrowRight className="h-3 w-3 text-slate-600" />
                </li>
              ))}
            </ul>
          </div>

          {/* Path Breakdown */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Path Breakdown</h4>
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-slate-400">Full-Stack Developer Path</span>
              <span className="text-white">45%</span>
            </div>
            <ProgressBar value={45} color="cyan" className="h-1" />
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ============================================================
   ROADMAP CARD
   ============================================================ */

function RoadmapCard({ node, connected = false, bottom = false }: { node: RoadmapNode; connected?: boolean; bottom?: boolean }) {
  const statusConfig: Record<RoadmapStatus, { label: string; bg: string; text: string; border: string }> = {
    completo: { label: "Completo", bg: "bg-emerald-400/10", text: "text-emerald-400", border: "border-emerald-400/20" },
    andamento: { label: "Em Andamento", bg: "bg-amber-400/10", text: "text-amber-400", border: "border-amber-400/20" },
    bloqueado: { label: "Bloqueado", bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20" },
  };
  const s = statusConfig[node.status];

  return (
    <div className="relative group rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] hover:border-white/[0.1] hover:shadow-[0_0_25px_rgba(255,255,255,0.03)]">
      {node.badge && (
        <span className="absolute -top-3 left-4 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold {s.text} {s.bg} {s.border}">
          {s.label}
        </span>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-lg bg-white/[0.05] flex items-center justify-center border border-white/[0.05]">
          <node.icon className={cn("h-4 w-4")} />
        </div>
        {node.progress !== undefined && node.progress < 100 && (
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[10px] font-semibold text-slate-400">{node.progress}%</span>
          </div>
        )}
      </div>

      <h3 className="text-sm font-semibold text-white leading-tight">{node.title}</h3>
      {node.subtitle && (
        <p className="mt-1 text-xs text-slate-500">{node.subtitle}</p>
      )}

      {node.progress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Progresso da tarefa</span>
            <span className="text-slate-400">{node.progress}%</span>
          </div>
          <ProgressBar value={node.progress} color="cyan" className="h-1" />
        </div>
      )}

      <div className="mt-3 space-y-1">
        {node.checks.map((check, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded border border-white/[0.1] bg-white/[0.02]"></span>
            <span className="text-xs text-slate-400">{check}</span>
          </div>
        ))}
      </div>

      {node.bottomAction && (
        <button
          className={cn(
            "mt-4 w-full py-1.5 rounded-lg text-xs font-semibold transition-all border",
            node.bottomAction.variant === "fill"
              ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              : "border-white/[0.06] text-slate-400 hover:border-white/[0.1] hover:text-white",
          )}
        >
          {node.bottomAction.label}
        </button>
      )}
    </div>
  );
}
