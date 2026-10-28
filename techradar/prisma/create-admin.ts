import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] ?? "admin@techradar.dev";
  const password = process.argv[3] ?? "Admin@123";

  const passwordHash = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", password: passwordHash },
    create: {
      email,
      name: "TechRadar Admin",
      password: passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Admin criado: ${admin.id} (${admin.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
