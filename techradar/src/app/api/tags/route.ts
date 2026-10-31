import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().optional(),
});

/**
 * GET /api/tags
 * Lista tags do usuário.
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { notes: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: tags });
}

/**
 * POST /api/tags
 * Cria uma nova tag.
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createTagSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, color } = parsed.data;
  const slug = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  try {
    const tag = await prisma.tag.create({
      data: { userId: session.user.id as string, name, slug, color },
    });
    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Tag já existe" }, { status: 409 });
  }
}
