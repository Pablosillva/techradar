import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/admin/audiobooks/[id]
 * Atualiza um audiobook (admin).
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
  const audiobook = await prisma.audiobook.update({
    where: { id },
    data: {
      title: body.title,
      authors: body.authors ?? [],
      narrator: body.narrator,
      description: body.description,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl,
      language: body.language,
      durationMin: body.durationMin,
      isFree: body.isFree,
    },
  });

  // Atualiza skills (substitui)
  if (body.skillSlugs) {
    const skillIds = await prisma.skill.findMany({
      where: { slug: { in: body.skillSlugs } },
      select: { id: true },
    });
    const skillIdSet = new Set(skillIds.map((s) => s.id));

    await prisma.audiobookSkill.deleteMany({ where: { audiobookId: id } });
    for (const skillId of skillIdSet) {
      await prisma.audiobookSkill.create({
        data: { audiobookId: id, skillId },
      });
    }
  }

  return NextResponse.json({ data: audiobook });
}
