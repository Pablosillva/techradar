import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RoadmapWorkspace } from "@/components/roadmap/roadmap-workspace";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  RoadmapDto,
  RoadmapItemStatus,
  RoadmapLevel,
  StudyContentType,
} from "@/lib/roadmap/types";

export const metadata: Metadata = {
  title: "Roadmap",
};

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
    level: roadmap.level as RoadmapLevel,
    color: roadmap.color,
    order: roadmap.order,
    items: roadmap.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status as RoadmapItemStatus,
      order: item.order,
      estimatedMinutes: item.estimatedMinutes,
      resourceUrl: item.resourceUrl,
      contents: item.contents.map((content) => ({
        id: content.id,
        title: content.title,
        type: content.type as StudyContentType,
        content: content.content,
        url: content.url,
        order: content.order,
      })),
    })),
  }));

  return <RoadmapWorkspace roadmaps={data} />;
}
