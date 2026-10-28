import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/admin/courses/[id]
 * Atualiza um curso (admin).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const course = await prisma.course.update({
    where: { id },
    data: {
      title: body.title,
      provider: body.provider,
      description: body.description,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl,
      language: body.language,
      isFree: body.isFree,
      price: body.price,
      currency: body.currency,
      level: body.level,
      duration: body.duration,
      rating: body.rating,
    },
  });

  // Atualiza skills (substitui)
  if (body.skillSlugs) {
    const skillIds = await prisma.skill.findMany({
      where: { slug: { in: body.skillSlugs } },
      select: { id: true },
    });
    const skillIdSet = new Set(skillIds.map((s) => s.id));

    await prisma.courseSkill.deleteMany({ where: { courseId: id } });
    for (const skillId of skillIdSet) {
      await prisma.courseSkill.create({
        data: { courseId: id, skillId },
      });
    }
  }

  return NextResponse.json({ data: course });
}
