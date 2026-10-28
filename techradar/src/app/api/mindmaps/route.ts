import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/mindmaps
 * Lista mapas mentais do usuário.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const mindMaps = await prisma.mindMap.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: mindMaps });
}

/**
 * POST /api/mindmaps
 * Cria um mapa mental (tópico raiz).
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";

  if (!title || !topic) {
    return NextResponse.json(
      { error: "title e topic são obrigatórios" },
      { status: 400 }
    );
  }

  const mindMap = await prisma.mindMap.create({
    data: {
      userId: session.user.id as string,
      title,
      topic,
      nodes: [{ id: "root", type: "default", position: { x: 0, y: 0 }, data: { label: topic } }],
      edges: [],
    },
  });

  return NextResponse.json({ data: mindMap }, { status: 201 });
}
