import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateCsrfRequest, getCsrfTokenFromCookie } from "@/lib/security/csrf";

const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  provider: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  url: z.string().url().max(2048).optional().nullable(),
  thumbnailUrl: z.string().url().max(2048).optional().nullable(),
  language: z.string().min(1).max(10).optional(),
  isFree: z.boolean().optional(),
  price: z.coerce.number().min(0).max(1_000_000).optional().nullable(),
  currency: z.string().min(1).max(10).optional(),
  level: z.string().min(1).max(50).optional(),
  duration: z.coerce.number().int().min(0).max(100_000).optional().nullable(),
  rating: z.coerce.number().min(0).max(5).optional().nullable(),
  skillSlugs: z.array(z.string()).optional(),
});

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
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", code: "VALIDATION_ERROR", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.provider !== undefined ? { provider: data.provider } : {}),
      ...(data.description !== undefined ? { description: data.description ?? undefined } : {}),
      ...(data.url !== undefined ? { url: data.url ?? undefined } : {}),
      ...(data.thumbnailUrl !== undefined ? { thumbnailUrl: data.thumbnailUrl ?? undefined } : {}),
      ...(data.language !== undefined ? { language: data.language } : {}),
      ...(data.isFree !== undefined ? { isFree: data.isFree } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.currency !== undefined ? { currency: data.currency ?? undefined } : {}),
      ...(data.level !== undefined ? { level: data.level } : {}),
      ...(data.duration !== undefined && data.duration !== null ? { duration: String(data.duration) } : {}),
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
    },
  });

  // Atualiza skills (substitui)
  if (data.skillSlugs !== undefined) {
    const skillIds = await prisma.skill.findMany({
      where: { slug: { in: data.skillSlugs } },
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
