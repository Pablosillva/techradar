import { promises as fs } from "fs";
import { NextResponse } from "next/server";
import { ApiError, handleRoute } from "@/lib/api/response";
import { requireAdminUser } from "@/lib/api/auth";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validations/common";
import { LIBRARY_ITEM_TYPES } from "@/lib/validations/library";
import {
  detectFileType,
  ensureUploadDir,
  generateFileKey,
  maxSizeFor,
  storagePath,
} from "@/lib/upload";
import { cookies } from "next/headers";
import { validateCsrfRequest } from "@/lib/security/csrf";

type AcceptedItemType = (typeof LIBRARY_ITEM_TYPES)[number];

/** POST /api/admin/library/upload — upload seguro de PDF/áudio (apenas admin). */
export async function POST(request: Request) {
  return handleRoute(async () => {
    await requireAdminUser();

    // CSRF protection for multipart form uploads
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("csrf_token")?.value ?? null;
    const csrfValidation = validateCsrfRequest(request, cookieToken);
    if (!csrfValidation.valid) {
      throw new ApiError(403, csrfValidation.reason, { code: "CSRF_INVALID" });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = String(formData.get("title") ?? "").trim();
    const itemType = String(formData.get("itemType") ?? "");
    const userId = String(formData.get("userId") ?? "").trim();

    if (!file) {
      throw new ApiError(400, "Arquivo é obrigatório", { code: "VALIDATION_ERROR" });
    }
    if (!title) {
      throw new ApiError(400, "Título é obrigatório", { code: "VALIDATION_ERROR" });
    }
    if (!LIBRARY_ITEM_TYPES.includes(itemType as AcceptedItemType)) {
      throw new ApiError(400, "Tipo de item inválido (use pdf ou audiobook)", {
        code: "VALIDATION_ERROR",
      });
    }
    if (!idSchema.safeParse(userId).success) {
      throw new ApiError(400, "Usuário inválido", { code: "VALIDATION_ERROR" });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic number: tipo real pelo cabeçalho binário, nunca pelo MIME/nome do cliente.
    const detected = detectFileType(buffer);
    if (!detected) {
      throw new ApiError(400, "Tipo de arquivo não reconhecido ou não suportado", {
        code: "VALIDATION_ERROR",
      });
    }

    const expectedKind = itemType === "pdf" ? "pdf" : "audio";
    if (detected.kind !== expectedKind) {
      throw new ApiError(
        400,
        "O conteúdo do arquivo não corresponde ao tipo informado",
        { code: "VALIDATION_ERROR" }
      );
    }

    const maxSize = maxSizeFor(expectedKind);
    if (buffer.length > maxSize) {
      throw new ApiError(
        400,
        `Arquivo muito grande (máx. ${Math.round(maxSize / (1024 * 1024))} MB)`,
        { code: "VALIDATION_ERROR" }
      );
    }

    await ensureUploadDir();
    const fileKey = generateFileKey(detected.ext);
    await fs.writeFile(storagePath(fileKey), buffer);

    const item = await prisma.libraryItem.create({
      data: {
        userId,
        itemType: itemType as AcceptedItemType,
        itemId: fileKey,
        title,
        author: null,
        coverUrl: null,
        fileUrl: `/api/library-files/${fileKey}`,
        fileKey,
        mimeType: detected.mime,
        fileSize: buffer.length,
        totalPages: null,
        durationSec: null,
        status: "to_read",
        progress: 0,
        rating: null,
        notes: null,
      },
    });

    return NextResponse.json({ data: item }, { status: 201 });
  });
}
