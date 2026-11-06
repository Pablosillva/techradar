import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoadmapWorkspace } from "@/components/roadmap/roadmap-workspace";
import type { RoadmapDto } from "@/lib/roadmap/types";

export default async function RoadmapPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/entrar");
  }

  const roadmaps = await prisma.roadmap.findMany({
    where: {
      userId: session.user.id,
      isArchived: false,
    },
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

  const data: RoadmapDto[] = roadmaps.map((roadmap) => ({
    id: roadmap.id,
    title: roadmap.title,
    description: roadmap.description,
    goal: roadmap.goal,
    level: roadmap.level as "beginner" | "intermediate" | "advanced",
    color: roadmap.color,
    order: roadmap.order,
    items: roadmap.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status as
        | "NOT_STARTED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "NEEDS_REVIEW",
      order: item.order,
      estimatedMinutes: item.estimatedMinutes,
      resourceUrl: item.resourceUrl,
      contents: item.contents.map((content) => ({
        id: content.id,
        title: content.title,
        type: content.type as
          | "NOTE"
          | "LINK"
          | "VIDEO"
          | "ARTICLE"
          | "PDF",
        content: content.content,
        url: content.url,
        order: content.order,
      })),
    })),
  }));

  return <RoadmapWorkspace roadmaps={data} />;
}
