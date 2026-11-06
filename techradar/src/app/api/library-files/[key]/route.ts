import { promises as fsp } from "fs";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storagePath } from "@/lib/upload";
import { parseByteRange } from "@/lib/upload/range";

type RouteContext = { params: Promise<{ key: string }> };

/**
 * GET /api/library-files/[key]
 * Serve o arquivo binário com acesso restrito: apenas o dono do item da
 * biblioteca ou um administrador (role lida do banco) podem visualizar.
 * Suporta requisições Range para permitir seek em audiobooks.
 */
export async function GET(request: Request, { params }: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // A role do JWT pode estar desatualizada; confere no banco a cada acesso.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
  }

  const { key } = await params;

  // Chave segura: apenas alfanumérico e um ponto, impede path traversal.
  if (!/^[a-z0-9]+\.[a-z0-9]+$/i.test(key)) {
    return NextResponse.json(
      { error: "Chave de arquivo inválida", code: "VALIDATION_ERROR" },
      { status: 400 },
    );
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
  if (item.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a este arquivo" }, { status: 403 });
  }

  const path = storagePath(key);

  let fileStat;
  try {
    fileStat = await fsp.stat(path);
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado no servidor" }, { status: 404 });
  }

  if (!fileStat.isFile()) {
    return NextResponse.json({ error: "Arquivo inválido" }, { status: 404 });
  }

  const size = fileStat.size;
  const fileName = encodeURIComponent(item.title || key);
  const baseHeaders: Record<string, string> = {
    "Content-Type": item.mimeType ?? "application/octet-stream",
    "Content-Disposition": `inline; filename="${fileName}"; filename*=UTF-8''${fileName}`,
    "Cache-Control": "private, no-store",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
  };

  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const range = parseByteRange(rangeHeader, size);

    if (!range) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes */${size}`,
        },
      });
    }

    const length = range.end - range.start + 1;
    const handle = await fsp.open(path, "r");

    try {
      const buffer = Buffer.alloc(length);
      await handle.read(buffer, 0, length, range.start);

      return new NextResponse(buffer, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
          "Content-Length": String(length),
        },
      });
    } finally {
      await handle.close();
    }
  }

  const buffer = await fsp.readFile(path);

  return new NextResponse(buffer, {
    headers: {
      ...baseHeaders,
      "Content-Length": String(size),
    },
  });
}
