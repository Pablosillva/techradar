import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/books
 * Lista livros (com skills).
 */
export async function GET() {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const books = await prisma.book.findMany({
    include: { skills: { include: { skill: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    data: books.map((b) => ({
      ...b,
      skills: b.skills.map((s) => s.skill.slug),
    })),
  });
}
