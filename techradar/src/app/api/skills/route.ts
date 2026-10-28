import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/skills
 * Retorna skills populares com contagem de vagas.
 */
export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      where: {
        jobSkills: { some: {} },
      },
      include: {
        _count: {
          select: { jobSkills: true },
        },
      },
      orderBy: {
        jobSkills: { _count: "desc" },
      },
      take: 20,
    });

    return NextResponse.json({
      data: skills.map((s) => ({
        slug: s.slug,
        name: s.name,
        category: s.category,
        count: s._count.jobSkills,
      })),
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Erro ao buscar skills" },
      { status: 500 }
    );
  }
}
