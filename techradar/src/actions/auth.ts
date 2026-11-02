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
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/cadastrar?error=dados-incompletos");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    redirect("/cadastrar?error=email-em-uso");
  }

  const { hash } = await import("bcryptjs");
  const hashedPassword = await hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      name: name || null,
      password: hashedPassword,
      role: "USER",
    },
  });

  redirect("/entrar?ok=conta-criada");
}
