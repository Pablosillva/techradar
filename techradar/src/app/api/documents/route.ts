import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  fileType: z.enum(["pdf", "epub"]),
  fileUrl: z.string().url(),
  fileSize: z.number().positive(),
  pageCount: z.number().int().positive().optional(),
});

/**
 * GET /api/documents
 * Lista documentos do usuário.
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { highlights: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: documents });
}

/**
 * POST /api/documents
 * Registra um novo documento na biblioteca.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const document = await prisma.document.create({
    data: {
      userId: session.user.id as string,
      ...parsed.data,
    },
    include: {
      _count: { select: { highlights: true } },
    },
  });

  return NextResponse.json({ data: document }, { status: 201 });
}
