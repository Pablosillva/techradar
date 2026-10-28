import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/courses
 * Lista cursos (com skills).
 */
export async function GET() {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await prisma.course.findMany({
    include: { skills: { include: { skill: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    data: courses.map((c) => ({
      ...c,
      skills: c.skills.map((s) => s.skill.slug),
    })),
  });
}
