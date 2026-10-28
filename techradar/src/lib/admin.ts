import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface AdminSession {
  session: Session | null;
  userId: string | null;
  isAdmin: boolean;
}

/**
 * Verifica se o usuário autenticado atual é admin.
 * Retorna { isAdmin } para facilitar o uso nos route handlers.
 */
export async function getAdminSession(): Promise<AdminSession> {
  const session: Session | null = await auth();

  if (!session?.user?.id) {
    return { session, userId: null, isAdmin: false };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });

  const isAdmin = user?.role === "ADMIN";

  return { session, userId: user?.id ?? null, isAdmin };
}

/**
 * Exige que o usuário seja admin. Use em server components e route handlers.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const { session, userId, isAdmin } = await getAdminSession();

  if (!isAdmin) {
    throw new Error("Unauthorized: admin required");
  }

  return { session, userId, isAdmin };
}
