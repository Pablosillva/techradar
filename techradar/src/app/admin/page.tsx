import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { RoadmapManager } from "@/components/admin/roadmap-manager";
import { LibraryManager } from "@/components/admin/library-manager";
import { Card, CardContent } from "@/components/ui/card";

interface AdminRoadmap {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  level: string;
  color: string | null;
  order: number;
  isArchived: boolean;
  owner: { id: string; name: string | null; email: string | null } | null;
  itemCount: number;
  completedCount: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminOwner {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface AdminLibraryItem {
  id: string;
  userId: string;
  owner: { id: string; name: string | null; email: string | null } | null;
  itemType: string;
  title: string | null;
  author: string | null;
  status: string;
  progress: number;
  currentPage: number | null;
  totalPages: number | null;
  positionSec: number | null;
  durationSec: number | null;
  rating: number | null;
  fileUrl: string | null;
  fileKey: string | null;
  mimeType: string | null;
  fileSize: number | null;
  coverUrl: string | null;
  notes: string | null;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default async function AdminPage() {
  const { session, isAdmin } = await getAdminSession();

  if (!session?.user) {
    redirect("/entrar");
  }

  if (!isAdmin) {
    redirect("/");
  }

  const [roadmapsRaw, libraryRaw, owners] = await Promise.all([
    prisma.roadmap.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { select: { id: true, status: true } },
      },
    }),
    prisma.libraryItem.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  const roadmaps: AdminRoadmap[] = roadmapsRaw.map((roadmap) => {
    const total = roadmap.items.length;
    const completed = roadmap.items.filter((i) => i.status === "COMPLETED").length;
    return {
      id: roadmap.id,
      title: roadmap.title,
      description: roadmap.description,
      goal: roadmap.goal,
      level: roadmap.level,
      color: roadmap.color,
      order: roadmap.order,
      isArchived: roadmap.isArchived,
      owner: roadmap.user,
      itemCount: total,
      completedCount: completed,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
      createdAt: roadmap.createdAt.toISOString(),
      updatedAt: roadmap.updatedAt.toISOString(),
    };
  });

  const library: AdminLibraryItem[] = libraryRaw.map((item) => ({
    id: item.id,
    userId: item.userId,
    owner: item.user,
    itemType: item.itemType,
    title: item.title,
    author: item.author,
    status: item.status,
    progress: item.progress,
    currentPage: item.currentPage,
    totalPages: item.totalPages,
    positionSec: item.positionSec,
    durationSec: item.durationSec,
    rating: item.rating,
    fileUrl: item.fileUrl,
    fileKey: item.fileKey,
    mimeType: item.mimeType,
    fileSize: item.fileSize,
    coverUrl: item.coverUrl,
    notes: item.notes,
    lastAccessedAt: item.lastAccessedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Área restrita
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            Painel Administrativo
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Gerencie trilhas, itens, conteúdos e arquivos da biblioteca de todos os
            usuários. Acesso exclusivo para contas com role ADMIN.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-slate-400">
            <strong className="text-slate-200">{roadmaps.length}</strong> trilhas
          </span>
          <span className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-slate-400">
            <strong className="text-slate-200">
              {roadmaps.reduce((total, roadmap) => total + roadmap.itemCount, 0)}
            </strong>{" "}
            itens
          </span>
          <span className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-slate-400">
            <strong className="text-slate-200">{library.length}</strong> arquivos
          </span>
          <span className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-slate-400">
            <strong className="text-slate-200">{owners.length}</strong> usuários
          </span>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <Card>
          <CardContent className="p-6">
            <RoadmapManager initialRoadmaps={roadmaps} owners={owners} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <LibraryManager initialItems={library} owners={owners} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
