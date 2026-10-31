import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  markdown: z.string().optional().default(""),
  source: z.enum(["manual", "ai", "book", "lecture", "highlight"]).optional(),
  tagIds: z.array(z.string()).optional(),
});

/**
 * GET /api/notes
 * Lista notas do usuário com busca opcional.
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const tagId = searchParams.get("tagId");

  const notes = await prisma.studyNote.findMany({
    where: {
      userId: session.user.id as string,
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { markdown: { contains: q, mode: "insensitive" } }] } : {}),
      ...(tagId ? { tags: { some: { tagId } } } : {}),
    },
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: notes });
}

/**
 * POST /api/notes
 * Cria uma nova nota.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, markdown, source, tagIds } = parsed.data;

  const note = await prisma.studyNote.create({
    data: {
      userId: session.user.id as string,
      title,
      markdown,
      source: source ?? "manual",
      ...(tagIds?.length
        ? {
            tags: {
              create: tagIds.map((tagId) => ({ tagId })),
            },
          }
        : {}),
    },
    include: {
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json({ data: note }, { status: 201 });
}
