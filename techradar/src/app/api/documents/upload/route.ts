import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/documents/upload
 * Recebe um arquivo (PDF/EPUB), converte para base64 e registra no banco.
 * Limite: ~10 MB (base64 aumenta ~33%).
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;

  if (!file) {
    return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });
  }

  const fileType = file.name.endsWith(".epub") ? "epub" : "pdf";
  const maxSize = 10 * 1024 * 1024; // 10 MB

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "Arquivo muito grande (máx. 10 MB)" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const fileData = `data:${file.type};base64,${base64}`;

  const document = await prisma.document.create({
    data: {
      userId: session.user.id as string,
      title: title || file.name,
      fileType,
      fileUrl: `/api/documents/${"temp"}/file`, // placeholder, será preenchido abaixo
      fileData,
      fileSize: file.size,
      pageCount: null,
    },
  });

  return NextResponse.json({ data: document }, { status: 201 });
}
