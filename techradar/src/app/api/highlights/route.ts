import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createHighlightSchema = z.object({
  documentId: z.string(),
  text: z.string().min(1),
  page: z.number().int().positive(),
  position: z.any().optional(),
  noteId: z.string().optional(),
});

/**
 * GET /api/highlights
 * Lista destaques de um documento.
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  const highlights = await prisma.highlight.findMany({
    where: {
      userId: session.user.id,
      ...(documentId ? { documentId } : {}),
    },
    orderBy: { page: "asc", createdAt: "desc" },
  });

  return NextResponse.json({ data: highlights });
}

/**
 * POST /api/highlights
 * Cria um destaque (trecho destacado no documento).
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createHighlightSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { documentId, text, page, position } = parsed.data;

  const highlight = await prisma.highlight.create({
    data: {
      userId: session.user.id as string,
      documentId,
      text,
      page,
      position: position ?? null,
    },
  });

  return NextResponse.json({ data: highlight }, { status: 201 });
}
