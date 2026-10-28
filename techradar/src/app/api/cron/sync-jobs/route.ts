import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchRemotiveJobs, normalizeRemotiveJob } from "@/lib/sources/remotive";
import { fetchArbeitnowJobs, normalizeArbeitnowJob } from "@/lib/sources/arbeitnow";
import { extractSkillsFromText } from "@/lib/skills/extract";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const xCronSecret = request.headers.get("x-cron-secret");
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");

  const expectedToken = process.env.CRON_SECRET;
  const providedToken = authHeader?.replace(/^Bearer\s+/i, "") ?? xCronSecret ?? querySecret;

  if (!expectedToken || providedToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [remotiveJobs, arbeitnowJobs] = await Promise.all([
      fetchRemotiveJobs("", 50).catch(() => []),
      fetchArbeitnowJobs("", 50).catch(() => []),
    ]);

    const allJobs = [
      ...remotiveJobs.map(normalizeRemotiveJob),
      ...arbeitnowJobs.map(normalizeArbeitnowJob),
    ];

    let created = 0;
    let updated = 0;

    for (const jobData of allJobs) {
      const skills = extractSkillsFromText(
        `${jobData.title} ${jobData.description}`
      );

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

      for (const skillSlug of skills) {
        const skill = await prisma.skill.findUnique({
          where: { slug: skillSlug },
        });
        if (skill) {
          await prisma.jobSkill.upsert({
            where: {
              jobId_skillId: { jobId: job.id, skillId: skill.id },
            },
            update: {},
            create: { jobId: job.id, skillId: skill.id },
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
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron sync error:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
