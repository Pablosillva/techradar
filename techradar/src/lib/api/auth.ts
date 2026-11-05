import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "./response";

export interface AuthedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Exige sessão válida e devolve o usuário do banco.
 * A role é lida do banco (não do JWT) para refletir mudanças imediatamente.
 */
export async function requireUser(): Promise<AuthedUser> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ApiError(401, "Não autorizado", { code: "UNAUTHORIZED" });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    throw new ApiError(401, "Sessão inválida", { code: "UNAUTHORIZED" });
  }

  return {
    id: user.id,
    email: user.email ?? "",
    name: user.name,
    role: user.role,
  };
}

/** Exige sessão válida + role ADMIN (verificada no banco). */
export async function requireAdminUser(): Promise<AuthedUser> {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    throw new ApiError(403, "Acesso restrito a administradores", {
      code: "FORBIDDEN",
    });
  }

  return user;
}
