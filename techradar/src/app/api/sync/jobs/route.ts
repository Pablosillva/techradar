import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchRemotiveJobs, normalizeRemotiveJob } from "@/lib/sources/remotive";
import { fetchArbeitnowJobs, normalizeArbeitnowJob } from "@/lib/sources/arbeitnow";
import { extractSkillsFromText } from "@/lib/skills/extract";

/**
 * POST /api/sync/jobs
 * Sincroniza vagas das APIs externas (Remotive + Arbeitnow).
 * Deve ser chamado periodicamente (cron job).
 */
export async function POST() {
  try {
    // Busca vagas de ambas as fontes
    const [remotiveJobs, arbeitnowJobs] = await Promise.all([
      fetchRemotiveJobs("", 50).catch((e) => {
        console.error("Remotive error:", e);
        return [];
      }),
      fetchArbeitnowJobs("", 50).catch((e) => {
        console.error("Arbeitnow error:", e);
        return [];
      }),
    ]);

    const allJobs = [
      ...remotiveJobs.map(normalizeRemotiveJob),
      ...arbeitnowJobs.map(normalizeArbeitnowJob),
    ];

    let created = 0;
    let updated = 0;

    for (const jobData of allJobs) {
      // Extrai skills do título + descrição
      const skills = extractSkillsFromText(
        `${jobData.title} ${jobData.description}`
      );

      // Upsert da vaga
      const job = await prisma.job.upsert({
        where: { externalId: jobData.externalId },
        update: {
          title: jobData.title,
          company: jobData.company,
          description: jobData.description,
          url: jobData.url,
          location: jobData.location,
          isRemote: jobData.isRemote,
          jobType: jobData.jobType,
          salaryMin: jobData.salaryMin,
          salaryMax: jobData.salaryMax,
          currency: jobData.currency,
          postedAt: jobData.postedAt,
          logoUrl: jobData.logoUrl,
          isActive: true,
        },
        create: jobData,
      });

      // Associa skills
      for (const skillSlug of skills) {
        const skill = await prisma.skill.findUnique({
          where: { slug: skillSlug },
        });
        if (skill) {
          await prisma.jobSkill.upsert({
            where: {
              jobId_skillId: {
                jobId: job.id,
                skillId: skill.id,
              },
            },
            update: {},
            create: {
              jobId: job.id,
              skillId: skill.id,
            },
          });
        }
      }

      if (job.createdAt === job.updatedAt) {
        created++;
      } else {
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      total: allJobs.length,
    });
  } catch (error) {
    console.error("Error syncing jobs:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar vagas" },
      { status: 500 }
    );
  }
}
