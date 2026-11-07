"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudy } from "@/lib/study/context";
import type { PortfolioProject, ProjectCover, ProjectStatus } from "@/lib/study/types";
import { ProjectCard } from "./project-card";
import { PortfolioCharts } from "./portfolio-charts";
import { Recommendations } from "@/components/study/evolucao/recommendations";

type Filter = "all" | "in-progress" | "completed" | "highlight" | "review";

const TABS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "in-progress", label: "Em Andamento" },
  { id: "completed", label: "Concluídos" },
  { id: "highlight", label: "Em Destaque" },
  { id: "review", label: "Para Revisão" },
];

export default function ProjetosPage() {
  const {
    projects,
    roadmapNodes,
    modules,
    categoryProgress,
    addProject,
    updateProjectProgress,
    toggleHighlight,
    toggleReview,
    updateProject,
    updateLabProjectProgress,
    setActiveProject,
  } = useStudy();

  const [activeTab, setActiveTab] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PortfolioProject | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    techs: "",
    cover: "generic" as ProjectCover,
    status: "idea" as ProjectStatus,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (activeTab === "in-progress" && p.status !== "in-progress") return false;
      if (activeTab === "completed" && !(p.status === "completed" || p.progress >= 100)) return false;
      if (activeTab === "highlight" && !p.isHighlighted) return false;
      if (activeTab === "review" && !p.needsReview) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.techs.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [projects, activeTab, search]);

  const avgProgress = useMemo(
    () => (projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0),
    [projects],
  );

  function openCreate() {
    setEditing(null);
    setForm({ title: "", description: "", techs: "", cover: "generic", status: "idea" });
    setShowForm(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const techs = form.techs.split(",").map((t) => t.trim()).filter(Boolean);
    if (!form.title.trim() || techs.length === 0) return;
    if (editing) {
      updateProject(editing.id, {
        title: form.title,
        description: form.description,
        techs,
        cover: form.cover,
        status: form.status,
      });
    } else {
      addProject({
        title: form.title,
        description: form.description || "Sem descrição.",
        techs,
        category: "web-development",
        cover: form.cover,
        status: form.status,
        progress: form.status === "completed" ? 100 : 0,
      });
    }
    setShowForm(false);
    setEditing(null);
  }

  function openEdit(project: PortfolioProject) {
    setEditing(project);
    setForm({
      title: project.title,
      description: project.description,
      techs: project.techs.join(", "),
      cover: project.cover,
      status: project.status,
    });
    setShowForm(true);
  }

  function openLab(project: PortfolioProject) {
    if (project.relatedLabProjectId) {
      setActiveProject(project.relatedLabProjectId);
    }
    window.location.href = "/laboratorio";
  }

  const topTech = useMemo(() => {
    const cats: Array<{ cat: string; value: number }> = [
      { cat: "web-development", value: categoryProgress("web-development" as never) },
      { cat: "mobile-dev", value: categoryProgress("mobile-dev" as never) },
      { cat: "cloud-computing", value: categoryProgress("cloud-computing" as never) },
      { cat: "devops", value: categoryProgress("devops" as never) },
    ];
    return cats;
  }, [categoryProgress]);

  const nextSteps = useMemo(
    () =>
      [...roadmapNodes]
        .sort((a, b) => a.order - b.order)
        .filter((n) => n.status !== "completo")
        .slice(0, 3),
    [roadmapNodes],
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0f172a] text-slate-300">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0f172a]/80 px-6 backdrop-blur">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Seus Projetos e Portfólio</h1>
          <p className="text-sm text-slate-400">Vitrine do que você construiu — sincronizada com Laboratório, Conteúdo e Evolução</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisa Rápida em Projetos…"
              className="h-9 w-64 rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20"
          >
            <Plus className="h-3.5 w-3.5" /> Novo Projeto
          </button>
        </div>
      </header>

      <div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-white/[0.06] bg-[#0f172a]/80 px-6 backdrop-blur">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex h-11 shrink-0 items-center gap-1.5 border-b-2 px-4 text-xs font-medium transition-colors",
                isActive
                  ? "border-cyan-400 text-cyan-300 bg-cyan-400/[0.04]"
                  : "border-transparent text-slate-400 hover:text-slate-200",
              )}
            >
              {tab.label}
            </button>
          );
        })}
        <span className="ml-auto hidden text-[11px] text-slate-500 sm:block">
          {filtered.length}/{projects.length} projetos · média {avgProgress}%
        </span>
      </div>

      <main className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="mx-auto mt-16 max-w-md rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <p className="text-sm font-semibold text-white">Nenhum projeto aqui ainda.</p>
              <p className="mt-1 text-xs text-slate-500">
                {search ? `Nada para “${search}” neste filtro.` : "Clique em Novo Projeto para adicionar em ideia ou avance no Laboratório."}
              </p>
              <button onClick={openCreate} className="mt-5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20">
                <Plus className="mr-1 inline h-3.5 w-3.5" /> Criar projeto
              </button>
            </div>
          ) : (
            <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={openEdit}
                  onToggleHighlight={toggleHighlight}
                  onToggleReview={toggleReview}
                  onOpenLab={openLab}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="hidden w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-white/[0.06] bg-[#0d1420] p-4 lg:flex">
          <PortfolioCharts projects={projects} />

          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Your Learning Status</p>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Milestone</span>
                  <span className="font-semibold text-slate-200">{avgProgress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${avgProgress}%` }} />
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold text-slate-400">Top Tech for Path</p>
                <div className="space-y-2">
                  {topTech.map((t) => (
                    <div key={t.cat} className="flex items-center gap-2 text-[11px]">
                      <span className="w-28 truncate text-slate-400">{t.cat}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full bg-cyan-400" style={{ width: `${t.value}%` }} />
                      </div>
                      <span className="text-slate-200">{t.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold text-slate-400">Recommended Next Steps</p>
                <div className="space-y-1.5">
                  {nextSteps.map((n) => (
                    <Link
                      key={n.id}
                      href="/roadmap"
                      className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2 text-xs text-slate-200 hover:border-cyan-400/30"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-[10px] font-bold text-cyan-300">{n.order}</span>
                      <span className="truncate">{n.title}</span>
                    </Link>
                  ))}
                  {nextSteps.length === 0 && <p className="text-xs text-slate-500">Trilha completa 🎉</p>}
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Path Breakdown</span>
                  <span className="font-semibold text-slate-200">{avgProgress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${avgProgress}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">Full-Stack Developer Path</p>
              </div>
            </div>
          </div>

          <Recommendations />
        </aside>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1420] p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">{editing ? "Editar projeto" : "Novo projeto"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Título</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
                  placeholder="Ex.: Minha API de pagamentos"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-400">Tecnologias (separadas por vírgula)</label>
                <input
                  value={form.techs}
                  onChange={(e) => setForm({ ...form, techs: e.target.value })}
                  placeholder="React, Node.js, PostgreSQL"
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Capa</label>
                  <select
                    value={form.cover}
                    onChange={(e) => setForm({ ...form, cover: e.target.value as ProjectCover })}
                    className="h-10 w-full rounded-lg border border-white/10 bg-[#0d1420] px-2 text-sm text-white"
                  >
                    <option value="portfolio">Portfólio</option>
                    <option value="aws">AWS</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="python">Python</option>
                    <option value="api">API</option>
                    <option value="generic">Genérico</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                    className="h-10 w-full rounded-lg border border-white/10 bg-[#0d1420] px-2 text-sm text-white"
                  >
                    <option value="idea">Em Ideia (0%)</option>
                    <option value="in-progress">Em Andamento</option>
                    <option value="completed">Concluído (100%)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-400 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300">
                  <Check className="h-4 w-4" /> {editing ? "Salvar alterações" : "Criar projeto"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5">
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
