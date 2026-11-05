import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateCsrfRequest, getCsrfTokenFromCookie } from "@/lib/security/csrf";

const updateSourceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  url: z.string().url().max(2048).optional(),
  source: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

/**
 * PATCH /api/admin/sources/[id]
 * Atualiza uma fonte de vagas (ou alterna isActive).
 */
export async function PATCH(
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
  const parsed = updateSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", code: "VALIDATION_ERROR", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const updated = await prisma.jobSource.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.url !== undefined ? { url: parsed.data.url } : {}),
      ...(parsed.data.source !== undefined ? { source: parsed.data.source } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
    },
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/admin/sources/[id]
 * Remove uma fonte de vagas.
 */
export async function DELETE(
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

  await prisma.jobSource.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
