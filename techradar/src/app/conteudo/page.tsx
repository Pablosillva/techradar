"use client";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronRight, ExternalLink, FileText, Link2, StickyNote, Video, Newspaper, Activity, AlertTriangle, CheckCircle2, Layers3, Loader2, Plus, Route, Target, X, Grid3, Map, BookOpen, FlaskConical, Briefcase, Library, ListTodo, Settings, Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  STATUS_META,
  formatDuration,
  safeHttpUrl,
  LEVEL_META,
} from "@/lib/roadmap/presentation";
import type {
  RoadmapDto,
  RoadmapItemDto,
  RoadmapItemStatus,
  StudyContentDto,
} from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function ConteudoPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/entrar");
  }

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId: session.user.id, isArchived: false },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          contents: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  const tabs = [
    { id: "web", label: "Web Development", active: true },
    { id: "mobile", label: "Mobile Dev" },
    { id: "devops", label: "DevOps" },
    { id: "cloud", label: "Cloud Computing" },
    { id: "data", label: "Data Science" },
    { id: "data2", label: "Data" },
  ];

  const allItems = roadmaps.flatMap((r) => r.items);
  const allContents = roadmaps.flatMap((r) =>
    r.items.flatMap((item) =>
      item.contents.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        content: c.content,
        url: c.url,
        order: c.order,
        itemId: item.id,
        itemTitle: item.title,
        itemStatus: item.status as RoadmapItemStatus,
        roadmapId: roadmap.id,
        roadmapTitle: roadmap.title,
      }))
    )
  );

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-slate-200">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/[0.05] z-50">
        <div className="flex items-center justify-between px-6 h-full">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-sm font-mono text-cyan-400">&lt;/</span>
              <span className="text-sm font-bold text-white">DevPath Hub</span>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisas hier conteúdos"
                className="w-96 px-4 py-2 rounded-md bg-[#1a1a2e] border border-white/[0.1] text-sm text-slate-300 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="px-3 py-2 text-sm text-slate-300">
                Resources <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
              <Button variant="glow" className="px-4 py-2 text-sm">
                Inicie Agora
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border border-white/[0.2] overflow-hidden">
                  <img src="https://api.dicebear.com/avataaars/svg/Pablo.svg" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <Bell className="ml-2 h-5 w-5 text-slate-400 hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col h-full pt-16">
        <aside className="fixed left-0 top-16 bottom-0 w-64 border-r border-white/[0.05] bg-[#0a0a0f]/90 backdrop-blur-md overflow-y-auto z-40">
          <div className="p-4 space-y-6">
            <nav className="space-y-2">
              {[{
                label: "Dashboard", icon: <Grid3 className="h-4 w-4" />, active: false,
              }, {
                label: "Roadmap", icon: <Map className="h-4 w-4" />, active: false,
              }, {
                label: "Caderno", icon: <BookOpen className="h-4 w-4" />, active: false,
              }, {
                label: "Laboratório", icon: <FlaskConical className="h-4 w-4" />, active: false,
              }, {
                label: "Conteúdo", icon: <FileText className="h-4 w-4" />, active: true,
              }, {
                label: "Exercícios", icon: <Activity className="h-4 w-4" />, active: false,
              }, {
                label: "Revisões", icon: <AlertTriangle className="h-4 w-4" />, active: false,
              }, {
                label: "Evolução", icon: <ChartLine className="h-4 w-4" />, active: false,
              }, {
                label: "Projetos", icon: <Folder className="h-4 w-4" />, active: false,
              }, {
                label: "Candidaturas", icon: <Briefcase className="h-4 w-4" />, active: false,
              }, {
                label: "Biblioteca", icon: <Library className="h-4 w-4" />, active: false,
              }, {
                label: "Tarefas", icon: <ListTodo className="h-4 w-4" />, active: false,
              }, {
                label: "Configurações", icon: <Settings className="h-4 w-4" />, active: false,
              }].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer hover:bg-white/[0.05]">
                  {item.icon}
                  <span className={cn(
                    "text-sm font-medium",
                    item.active ? "text-cyan-400" : "text-slate-400"
                  )}>
                    {item.label}
                  </span>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto pl-64 pt-4 pb-10">
          <div className="px-6 py-4 flex gap-3 overflow-x-auto">
            {tabs.map((tab, i) => (
              <button key={tab.id} onClick={() => {}} className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                tab.active
                  ? "bg-cyan-400/20 border border-cyan-400/50 text-cyan-400"
                  : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
              )}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="px-6 pb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {allContents.length > 0 ? (
              allContents.map((content) => (
                <div key={content.id} className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden transition-all hover:bg-white/[0.04]">
                  <div className="flex items-start gap-2 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-400/10 text-violet-300">
                      {content.type === "LINK" ? (
                        <Link2 className="h-3 w-3" />
                      ) : content.type === "VIDEO" ? (
                        <Video className="h-3 w-3" />
                      ) : (
                        <StickyNote className="h-3 w-3" />
                      )}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-200 truncate" title={content.title}>
                      {content.title}
                    </h3>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-slate-500 mt-1">{content.itemTitle}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant={STATUS_META[content.itemStatus as keyof typeof STATUS_META]?.badge ?? "secondary"} className="text-[10px]">
                        {STATUS_META[content.itemStatus as keyof typeof STATUS_META]?.label ?? content.itemStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 border-t border-white/[0.05]">
                    <button
                      onClick={() => {}}
                      className="flex items-center gap-1 w-full text-[10px] font-medium text-cyan-300 transition-colors hover:text-cyan-200"
                    >
                      Abrir conteúdo <ChevronRight className="h-3 w-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
                  <FileText className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">Nenhum conteúdo cadastrado</h3>
                <p className="mt-1 text-sm text-slate-400 max-w-xs">
                  Adicione conteúdos teóricos ou links oficiais aos itens de suas trilhas para visualizá-los aqui.
                </p>
                <Button type="button" variant="glow" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" /> Adicionar conteúdo
                </Button>
              </div>
            )}
          </div>
        </main>

        <aside className="w-[320px] overflow-y-auto px-4 pt-4 pb-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</h3>
              <div className="space-y-1.5">
                {[ "Not Started", "In Progress", "Completed"].map((status, i) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={false} />
                    <span className="text-xs text-slate-400 hover:text-slate-300">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Language</h3>
              <div className="space-y-1.5">
                {[ "Portuguese", "English", "Spanish"].map((lang) => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={lang === "Portuguese"} />
                    <span className="text-xs text-slate-400">{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Author</h3>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={false} />
                  <span className="text-xs text-slate-400">DevPath Team</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={false} />
                  <span className="text-xs text-slate-400">Community Experts</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {[ "React", "Node.js", "SQL", "AWS", "Git"].map((tag) => (
                  <button key={tag} className="px-2 py-1 rounded text-[10px] text-slate-400 border border-white/[0.10] hover:text-cyan-300 hover:border-cyan-400/30">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Your Learning Status</h3>
            <div className="space-y-3">
              {[{
                name: "Web Development", percent: 38, color: "text-cyan-400",
              }, {
                name: "Mobile Dev", percent: 19, color: "text-blue-400",
              }, {
                name: "DevOps", percent: 4, color: "text-emerald-400",
              }, {
                name: "Cloud Computing", percent: 10, color: "text-violet-400",
              }, {
                name: "Data Science", percent: 0, color: "text-amber-400",
              }].map((item) => (
                <div key={item.name} className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-2 w-8">
                    <div className={`h-2 w-2 rounded-full ${item.color}`} />
                  </div>
                  <div className="flex-1 text-[10px] text-slate-400 truncate">{item.name}</div>
                  <span className="text-xs text-slate-200 font-medium">{item.percent}%</span>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                <span>Overall Time</span>
                <span className="font-medium text-slate-200">1h 05m</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
