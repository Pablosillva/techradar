import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateCsrfRequest, getCsrfTokenFromCookie } from "@/lib/security/csrf";

const createSourceSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().max(2048),
  source: z.string().min(1).max(100),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/sources
 * Lista fontes de vagas configuradas (padrão + custom).
 */
export async function GET() {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await prisma.jobSource.findMany({
    orderBy: { createdAt: "desc" },
  });

  const defaults = ["remotive", "arbeitnow"];

  const allSources = [
    ...defaults.map((slug) => ({
      id: slug,
      name: slug === "remotive" ? "Remotive" : "Arbeitnow",
      url: slug === "remotive" ? "https://remotive.com/api/remote-jobs" : "https://www.arbeitnow.com/api/job-board-api",
      source: slug,
      isActive: true,
      isDefault: true,
    })),
    ...sources.map((s) => ({
      ...s,
      isDefault: false,
    })),
  ];

  return NextResponse.json({ data: allSources });
}

/**
 * POST /api/admin/sources
 * Cria uma nova fonte de vagas.
 */
export async function POST(request: Request) {
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
  const parsed = createSourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", code: "VALIDATION_ERROR", details: parsed.error.issues },
      { status: 422 }
    );
  }

  const { name, url, source, isActive } = parsed.data;

  const created = await prisma.jobSource.create({
    data: { name, url, source, isActive: isActive ?? true },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
