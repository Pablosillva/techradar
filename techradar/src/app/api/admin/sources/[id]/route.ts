import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/admin/sources/[id]
 * Atualiza uma fonte de vagas (ou alterna isActive).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updated = await prisma.jobSource.update({
    where: { id },
    data: {
      name: body.name,
      url: body.url,
      source: body.source,
      isActive: body.isActive ?? true,
    },
  });

  return NextResponse.json({ data: updated });
}

/**
 * DELETE /api/admin/sources/[id]
 * Remove uma fonte de vagas.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { isAdmin } = await getAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.jobSource.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
