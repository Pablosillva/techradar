"use server";

import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function githubSignInAction() {
  await signIn("github", { callbackUrl: "/" });
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/entrar?error=campos");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user?.password) {
    redirect("/entrar?error=credenciais");
  }

  const isValid = await compare(password, user.password);

  if (!isValid) {
    redirect("/entrar?error=credenciais");
  }

  await signIn("credentials", { email, password, redirectTo: "/" });
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");

  if (!email || !password) {
    redirect("/entrar?error=campos");
  }

  if (password.length < 6) {
    redirect("/entrar?error=senha");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/entrar?error=email");
  }

  const hashed = await hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name: name || null,
      role: "USER",
    },
  });

  await signIn("credentials", { email, password, redirectTo: "/" });
}
