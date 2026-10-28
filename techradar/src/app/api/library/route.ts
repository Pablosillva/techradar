import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/library
 * Lista itens da biblioteca do usuário.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const items = await prisma.libraryItem.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: items });
}

/**
 * POST /api/library
 * Adiciona um livro ou audiobook à biblioteca.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const itemType = typeof body.itemType === "string" ? body.itemType : "";
  const itemId = typeof body.itemId === "string" ? body.itemId : "";
  const status = typeof body.status === "string" ? body.status : "to_read";

  if (!itemType || !itemId) {
    return NextResponse.json(
      { error: "itemType e itemId são obrigatórios" },
      { status: 400 }
    );
  }
  if (!["book", "audiobook"].includes(itemType)) {
    return NextResponse.json(
      { error: 'itemType deve ser "book" ou "audiobook"' },
      { status: 400 }
    );
  }
  if (!["to_read", "reading", "completed"].includes(status)) {
    return NextResponse.json(
      { error: 'status deve ser "to_read", "reading" ou "completed"' },
      { status: 400 }
    );
  }

  const item = await prisma.libraryItem.create({
    data: {
      userId: session.user.id as string,
      itemType,
      itemId,
      status,
      progress: body.status === "completed" ? 100 : 0,
    },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
