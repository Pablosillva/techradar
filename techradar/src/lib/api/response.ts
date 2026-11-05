import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, type ZodType } from "zod";

/**
 * Erro de domínio da API. O status HTTP e o código são enviados ao cliente
 * sem vazar detalhes internos (stack trace, SQL, etc.).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(status: number, message: string, options?: { code?: string; details?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = options?.code;
    this.details = options?.details;
  }
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * Envolve um route handler e traduz exceções conhecidas em respostas seguras.
 * Erros inesperados viram 500 sem expor a mensagem original.
 */
export async function handleRoute(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.status }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", code: "VALIDATION_ERROR", details: error.issues },
        { status: 422 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Registro duplicado", code: "CONFLICT" },
          { status: 409 }
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Registro não encontrado", code: "NOT_FOUND" },
          { status: 404 }
        );
      }
    }

    console.error("[api] erro inesperado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * Lê e valida o corpo JSON da requisição com Zod.
 * Lança ApiError 400 para JSON inválido e 422 para payload fora do schema.
 */
export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    throw new ApiError(400, "Corpo da requisição deve ser JSON válido", {
      code: "INVALID_JSON",
    });
  }

  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    throw new ApiError(422, "Dados inválidos", {
      code: "VALIDATION_ERROR",
      details: parsed.error.issues,
    });
  }

  return parsed.data;
}

/** Valida os search params de um GET com Zod. */
export function parseQuery<T>(request: Request, schema: ZodType<T>): T {
  const { searchParams } = new URL(request.url);
  const raw = Object.fromEntries(searchParams.entries());
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    throw new ApiError(422, "Parâmetros inválidos", {
      code: "VALIDATION_ERROR",
      details: parsed.error.issues,
    });
  }

  return parsed.data;
}
