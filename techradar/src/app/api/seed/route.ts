import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { requireAdminUser } from "@/lib/api/auth";
import { handleRoute, jsonOk } from "@/lib/api/response";

export async function GET() {
  return handleRoute(async () => {
    await requireAdminUser();

    const adminPassword = await hash("D3vP@th_2026!S3cure_Adm#91", 12);
    const demoPassword = await hash("D3vP@th_2026!Us3r_S3cure#82", 12);

    const admin = await prisma.user.upsert({
      where: { email: "admin@devpath.com" },
      update: { role: "ADMIN", password: adminPassword, emailVerified: new Date() },
      create: { email: "admin@devpath.com", name: "DevPath Admin", password: adminPassword, role: "ADMIN", emailVerified: new Date() },
    });

    const pablo = await prisma.user.upsert({
      where: { email: "pablo@devpath.com" },
      update: { name: "Pablo Silva", password: demoPassword },
      create: { email: "pablo@devpath.com", name: "Pablo Silva", password: demoPassword, role: "USER", emailVerified: new Date() },
    });

    await prisma.userSettings.upsert({
      where: { userId: pablo.id },
      update: {},
      create: { userId: pablo.id, dailyGoalMinutes: 240, weeklyGoalMinutes: 1200 },
    });

    const roadmaps = [];
    for (let i = 0; i < 5; i++) {
      const roadmap = await prisma.roadmap.create({
        data: {
          userId: pablo.id,
          title: `Trilha ${i + 1}`,
          description: `Descrição da trilha ${i + 1}`,
          level: "beginner",
          color: "#22d3ee",
          order: i,
        },
      });
      console.log(`Created roadmap: ${roadmap.title}`);
    }

    return jsonOk({ success: true, message: "Seed executado com sucesso" });
  });
}
