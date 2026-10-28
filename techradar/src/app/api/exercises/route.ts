import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/exercises
 * Lista exercícios do usuário autenticado.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const exercises = await prisma.exercise.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: exercises });
}

/**
 * POST /api/exercises
 * Cria um exercício.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description : "";
  const starterCode = typeof body.starterCode === "string" ? body.starterCode : "";

  if (!title || !description) {
    return NextResponse.json(
      { error: "title e description são obrigatórios" },
      { status: 400 }
    );
  }

  const userId = session.user.id as string;

  const exercise = await prisma.exercise.create({
    data: {
      userId,
      title,
      description,
      language: body.language ?? "typescript",
      starterCode,
      solutionCode: body.solutionCode ?? null,
    },
  });

  return NextResponse.json({ data: exercise }, { status: 201 });
}
