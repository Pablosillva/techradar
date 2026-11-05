"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/entrar?error=credenciais");
  }

  const result = await signIn(formData);

  if (result?.error) {
    redirect("/entrar?error=credenciais");
  }

  redirect("/");
}

export async function githubSignInAction() {
  redirect("/entrar?error=github-desabilitado");
}

export async function logoutAction() {
  await signOut();
  redirect("/entrar");
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Validação mínima no servidor (não confiar apenas no HTML).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    redirect("/cadastrar?error=dados-invalidos");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    redirect("/cadastrar?error=email-em-uso");
  }

  const hashedPassword = await hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: name || null,
      password: hashedPassword,
      role: "USER",
      settings: {
        create: {},
      },
    },
  });

  redirect("/entrar?ok=conta-criada");
}
