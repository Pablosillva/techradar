import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/code-errors
 * Lista os erros de código registrados pelo usuário.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const errors = await prisma.codeError.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: errors });
}

/**
 * POST /api/code-errors
 * Registra um erro de código (problema → solução) para alimentar o diário.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const exerciseId = typeof body.exerciseId === "string" ? body.exerciseId : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";

  if (!exerciseId || !summary) {
    return NextResponse.json(
      { error: "exerciseId e summary são obrigatórios" },
      { status: 400 }
    );
  }

  const userId = session.user.id as string;

  const error = await prisma.codeError.create({
    data: {
      userId,
      exerciseId,
      summary,
      code: typeof body.code === "string" ? body.code : null,
      aiFeedback: typeof body.aiFeedback === "string" ? body.aiFeedback : null,
    },
  });

  return NextResponse.json({ data: error }, { status: 201 });
}
