import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/admin/books/[id]
 * Atualiza um livro (admin).
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
  const book = await prisma.book.update({
    where: { id },
    data: {
      title: body.title,
      authors: body.authors ?? [],
      description: body.description,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl,
      language: body.language,
      pageCount: body.pageCount,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
      publisher: body.publisher,
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

    await prisma.bookSkill.deleteMany({ where: { bookId: id } });
    for (const skillId of skillIdSet) {
      await prisma.bookSkill.create({
        data: { bookId: id, skillId },
      });
    }
  }

  return NextResponse.json({ data: book });
}
