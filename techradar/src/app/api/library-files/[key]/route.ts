import { promises as fsp } from "fs";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storagePath } from "@/lib/upload";

type RouteContext = { params: Promise<{ key: string }> };

/**
 * GET /api/library-files/[key]
 * Serve o arquivo binário com acesso restrito: apenas o dono do item da biblioteca
 * ou um administrador podem baixar/visualizar.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { key } = await params;

  // Chave segura: apenas alfanumérico e um ponto, impede path traversal.
  if (!/^[a-z0-9]+\.[a-z0-9]+$/i.test(key)) {
    return NextResponse.json({ error: "Chave de arquivo inválida", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const item = await prisma.libraryItem.findFirst({
    where: { fileKey: key },
    select: {
      id: true,
      title: true,
      mimeType: true,
      userId: true,
      fileKey: true,
    },
  });

  if (!item || !item.fileKey) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  // Acesso restrito: dono do item ou administrador.
  if (item.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a este arquivo" }, { status: 403 });
  }

  const path = storagePath(key);

  let fileStat;
  try {
    fileStat = await fsp.stat(path);
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado no servidor" }, { status: 404 });
  }

  const buffer = await fsp.readFile(path);
  const fileName = encodeURIComponent(item.title || key);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": item.mimeType ?? "application/octet-stream",
      "Content-Length": String(fileStat.size),
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
