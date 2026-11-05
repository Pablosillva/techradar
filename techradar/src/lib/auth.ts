import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";
import { generateCsrfToken, setCsrfTokenCookie } from "./security/csrf";
import { rateLimit } from "./security/rate-limit";

const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("AUTH_SECRET environment variable is required in production");
}

const SECRET = new TextEncoder().encode(
  AUTH_SECRET || "dev-secret-only-change-in-production",
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

  // Rate limiting por email para prevenir brute force
  const rl = rateLimit(`auth:signin:${email}`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return { error: "Muitas tentativas de login. Tente novamente em 1 minuto." };
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
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  // CSRF token cookie (readable by client for X-CSRF-Token header)
  const csrfToken = generateCsrfToken();
  cookieStore.set("csrf_token", csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return { success: true, user };
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("csrf_token");
}

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    throw new Error("Não autenticado");
  }
  return session;
}
