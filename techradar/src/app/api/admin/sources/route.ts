import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

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

  const body = await request.json();
  const { name, url, source, isActive } = body;

  if (!name || !url || !source) {
    return NextResponse.json(
      { error: "name, url e source são obrigatórios" },
      { status: 400 }
    );
  }

  const created = await prisma.jobSource.create({
    data: { name, url, source, isActive: isActive ?? true },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}
