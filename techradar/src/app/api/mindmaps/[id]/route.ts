import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/mindmaps/[id]
 * Busca um mapa mental (dono).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const mindMap = await prisma.mindMap.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!mindMap) {
    return NextResponse.json({ error: "Mapa não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: mindMap });
}

/**
 * PUT /api/mindmaps/[id]
 * Atualiza título/nós/arestas do mapa.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title : undefined;
  const nodes = Array.isArray(body.nodes) ? body.nodes : undefined;
  const edges = Array.isArray(body.edges) ? body.edges : undefined;

  const updated = await prisma.mindMap.update({
    where: { id },
    data: {
      ...(title ? { title } : {}),
      ...(nodes ? { nodes: nodes as never } : {}),
      ...(edges ? { edges: edges as never } : {}),
    },
  });

  // Garante que o usuário só acesse o próprio mapa
  const owned = await prisma.mindMap.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!owned) {
    return NextResponse.json({ error: "Mapa não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: owned });
}

/**
 * DELETE /api/mindmaps/[id]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const deleted = await prisma.mindMap.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: "Mapa não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
