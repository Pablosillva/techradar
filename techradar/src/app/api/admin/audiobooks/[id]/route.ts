import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateCsrfRequest, getCsrfTokenFromCookie } from "@/lib/security/csrf";

const updateAudiobookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  authors: z.array(z.string()).optional(),
  narrator: z.string().max(200).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  url: z.string().url().max(2048).optional().nullable(),
  thumbnailUrl: z.string().url().max(2048).optional().nullable(),
  language: z.string().min(1).max(10).optional(),
  durationMin: z.coerce.number().int().min(0).max(100_000).optional().nullable(),
  isFree: z.boolean().optional(),
  skillSlugs: z.array(z.string()).optional(),
});

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

  // CSRF protection for state-changing request
  const cookieToken = await getCsrfTokenFromCookie();
  const csrfValidation = validateCsrfRequest(request, cookieToken);
  if (!csrfValidation.valid) {
    return NextResponse.json(
      { error: csrfValidation.reason, code: "CSRF_INVALID" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = updateAudiobookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", code: "VALIDATION_ERROR", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const audiobook = await prisma.audiobook.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.authors !== undefined ? { authors: data.authors } : {}),
      ...(data.narrator !== undefined ? { narrator: data.narrator ?? undefined } : {}),
      ...(data.description !== undefined ? { description: data.description ?? undefined } : {}),
      ...(data.url !== undefined ? { url: data.url ?? undefined } : {}),
      ...(data.thumbnailUrl !== undefined ? { thumbnailUrl: data.thumbnailUrl ?? undefined } : {}),
      ...(data.language !== undefined ? { language: data.language } : {}),
      ...(data.durationMin !== undefined ? { durationMin: data.durationMin } : {}),
      ...(data.isFree !== undefined ? { isFree: data.isFree } : {}),
    },
  });

  // Atualiza skills (substitui)
  if (data.skillSlugs !== undefined) {
    const skillIds = await prisma.skill.findMany({
      where: { slug: { in: data.skillSlugs } },
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
