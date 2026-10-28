import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewCode } from "@/lib/ai";

/**
 * POST /api/exercises/[id]/ai-review
 * Revisa o código enviado (cria submissão com feedback da IA).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code : "";
  if (!code.trim()) {
    return NextResponse.json({ error: "code é obrigatório" }, { status: 400 });
  }

  const exercise = await prisma.exercise.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!exercise) {
    return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });
  }

  const solutionCode = typeof body.solutionCode === "string" ? body.solutionCode : "";
  const context = [
    exercise.description,
    solutionCode ? `Solução de referência:
${solutionCode}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const { feedback, score } = await reviewCode(code, context);

  const userId = session.user.id as string;

  const submission = await prisma.codeSubmission.create({
    data: {
      exerciseId: id,
      userId,
      code,
      aiFeedback: feedback,
    },
  });

  return NextResponse.json({ data: submission, review: { feedback, score } });
}
