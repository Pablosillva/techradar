import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin";
import { RoadmapManager } from "@/components/admin/roadmap-manager";
import { LibraryManager } from "@/components/admin/library-manager";
import { JobSourcesManager } from "@/components/admin/job-sources-manager";
import { CourseManager } from "@/components/admin/course-manager";
import { BookManager } from "@/components/admin/book-manager";
import { AudiobookManager } from "@/components/admin/audiobook-manager";
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

  const [roadmapsRaw, libraryRaw] = await Promise.all([
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
      <div className="mt-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Painel Administrativo
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Gerencie usuários, trilhas de estudo e a biblioteca de livros, PDFs e
          audiobooks.
        </p>
      </div>

      <div className="mt-8 space-y-12">
        {/* Roadmaps */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Trilhas de estudo</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Administre todas as trilhas, independentemente do dono.
                </p>
              </div>
            </div>
            <RoadmapManager initialRoadmaps={roadmaps} />
          </CardContent>
        </Card>

        {/* Biblioteca */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Biblioteca</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Livros, PDFs e audiobooks com upload seguro e acesso restrito.
                </p>
              </div>
            </div>
            <LibraryManager initialItems={library} />
          </CardContent>
        </Card>

        {/* Fontes de vagas */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Fontes de Vagas</h2>
            <p className="mt-1 text-sm text-slate-400">
              Adicione sites de vagas para que possam ser buscados no DevPath Hub.
            </p>
            <div className="mt-4">
              <JobSourcesManager initialSources={[]} />
            </div>
          </CardContent>
        </Card>

        {/* Cursos */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Cursos</h2>
            <CourseManager initialCourses={[]} />
          </CardContent>
        </Card>

        {/* Livros */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Livros</h2>
            <BookManager initialBooks={[]} />
          </CardContent>
        </Card>

        {/* Audiobooks */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Audiobooks</h2>
            <AudiobookManager initialAudiobooks={[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
