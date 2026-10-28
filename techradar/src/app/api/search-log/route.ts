import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/search-log
 * Registra uma busca para histórico e recomendações personalizadas.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();

    const { query, tab, filters, resultCount } = body;

    if (!query || !tab) {
      return NextResponse.json(
        { error: "query e tab são obrigatórios" },
        { status: 400 }
      );
    }

    const log = await prisma.searchLog.create({
      data: {
        userId: session?.user?.id ?? null,
        query,
        tab,
        filters: filters ?? null,
        resultCount: resultCount ?? 0,
      },
    });

    return NextResponse.json({ data: log });
  } catch (error) {
    console.error("Error logging search:", error);
    return NextResponse.json(
      { error: "Erro ao registrar busca" },
      { status: 500 }
    );
  }
}
