import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-do-not-use-in-production-change-me"
);

export async function auth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    return {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        name: payload.name as string | undefined,
        role: payload.role as string,
      },
    };
  } catch {
    return null;
  }
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Credenciais inválidas" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    return { error: "Credenciais inválidas" };
  }

  const isValid = await compare(password, user.password);

  if (!isValid) {
    return { error: "Credenciais inválidas" };
  }

  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return { success: true, user };
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new Error("Não autenticado");
  }
  return session;
}
