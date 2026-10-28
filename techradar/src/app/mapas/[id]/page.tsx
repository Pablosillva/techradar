import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MindMapCanvas } from "@/components/study/mind-map-canvas";

interface MindMapPageProps {
  params: Promise<{ id: string }>;
}

export default async function MindMapPage({ params }: MindMapPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/entrar");
  }

  const mindMap = await prisma.mindMap.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!mindMap) {
    notFound();
  }

  let nodes: Array<{ id: string; type?: string; position?: unknown; data?: unknown }> = [];
  let edges: unknown[] = [];
  try {
    nodes = mindMap.nodes ? JSON.parse(mindMap.nodes as unknown as string) : [];
  } catch {
    nodes = [];
  }
  try {
    edges = mindMap.edges ? JSON.parse(mindMap.edges as unknown as string) : [];
  } catch {
    edges = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {mindMap.title}
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Tópico: {mindMap.topic}
      </p>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-800 dark:bg-gray-900">
        <MindMapCanvas mapId={mindMap.id} title={mindMap.title} topic={mindMap.topic} />
      </div>
    </div>
  );
}
