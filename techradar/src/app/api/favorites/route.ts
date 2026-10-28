import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/favorites
 * Lista favoritos do usuário autenticado.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: favorites });
}

/**
 * POST /api/favorites
 * Adiciona um item aos favoritos.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { itemType, itemId } = body;

  if (!itemType || !itemId) {
    return NextResponse.json(
      { error: "itemType e itemId são obrigatórios" },
      { status: 400 }
    );
  }

  const validTypes = ["job", "course", "book", "audiobook"];
  if (!validTypes.includes(itemType)) {
    return NextResponse.json(
      { error: "itemType inválido" },
      { status: 400 }
    );
  }

  // Verifica se o item existe
  let itemExists = false;
  if (itemType === "job") {
    itemExists = !!(await prisma.job.findUnique({ where: { id: itemId } }));
  } else if (itemType === "course") {
    itemExists = !!(await prisma.course.findUnique({ where: { id: itemId } }));
  } else if (itemType === "book") {
    itemExists = !!(await prisma.book.findUnique({ where: { id: itemId } }));
  } else if (itemType === "audiobook") {
    itemExists = !!(await prisma.audiobook.findUnique({ where: { id: itemId } }));
  }

  if (!itemExists) {
    return NextResponse.json(
      { error: "Item não encontrado" },
      { status: 404 }
    );
  }

  const userId = session.user.id as string;

  // Cria ou ignora se já existe
  const favorite = await prisma.favorite.upsert({
    where: {
      userId_itemType_itemId: {
        userId,
        itemType,
        itemId,
      },
    },
    update: {},
    create: {
      userId,
      itemType,
      itemId,
    },
  });

  return NextResponse.json({ data: favorite });
}

/**
 * DELETE /api/favorites
 * Remove um item dos favoritos.
 */
export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const itemType = searchParams.get("itemType");
  const itemId = searchParams.get("itemId");

  if (!itemType || !itemId) {
    return NextResponse.json(
      { error: "itemType e itemId são obrigatórios" },
      { status: 400 }
    );
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id,
      itemType,
      itemId,
    },
  });

  return NextResponse.json({ success: true });
}
