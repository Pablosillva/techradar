import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/audiobooks
 * Lista audiobooks (com skills).
 */
export async function GET() {
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const audiobooks = await prisma.audiobook.findMany({
    include: { skills: { include: { skill: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    data: audiobooks.map((a) => ({
      ...a,
      skills: a.skills.map((s) => s.skill.slug),
    })),
  });
}
