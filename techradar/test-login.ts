// techradar/test-login.ts
import { compare } from "bcryptjs";
import { prisma } from "./src/lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@techradar.dev" },
  });

  if (!user) {
    console.log("❌ Usuário não encontrado!");
    return;
  }

  console.log("📧 Usuário:", user.email);
  console.log("🔑 Hash:", user.password?.substring(0, 30) + "...");

  const confere = await compare("Admin@123", user.password ?? "");
  console.log(confere ? "✅ Senha confere!" : "❌ Senha NÃO confere!");
}

main().catch(console.error);