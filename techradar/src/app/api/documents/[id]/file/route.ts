import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/documents/[id]/file
 * Retorna o arquivo binário (base64 decodificado) para visualização.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!document || !document.fileData) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  // Extrair base64 do data URL
  const base64 = document.fileData.split(",")[1];
  const buffer = Buffer.from(base64, "base64");

  const contentType = document.fileType === "epub" ? "application/epub+zip" : "application/pdf";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
      "Content-Disposition": `inline; filename="${document.title}.${document.fileType}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
