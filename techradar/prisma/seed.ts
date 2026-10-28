/**
 * Script de seed do TechRadar.
 * Popula o banco com skills do dicionário e dados reais das APIs.
 *
 * Uso: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import { SKILL_DEFINITIONS } from "../src/lib/skills/dictionary";
import { extractSkillsFromText } from "../src/lib/skills/extract";
import { fetchRemotiveJobs, normalizeRemotiveJob } from "../src/lib/sources/remotive";
import { fetchOpenLibraryBooks, normalizeOpenLibraryBook } from "../src/lib/sources/openlibrary";
import { fetchLibriVoxAudiobooks, normalizeLibriVoxAudiobook } from "../src/lib/sources/librivox";

const prisma = new PrismaClient();

async function seedSkills() {
  console.log("🌱 Populando skills...");

  for (const skill of SKILL_DEFINITIONS) {
    await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {
        name: skill.name,
        category: skill.category,
        aliases: skill.aliases,
      },
      create: {
        slug: skill.slug,
        name: skill.name,
        category: skill.category,
        aliases: skill.aliases,
      },
    });
  }

  console.log(`✅ ${SKILL_DEFINITIONS.length} skills criadas`);
}

async function seedJobs() {
  console.log("🌱 Populando vagas do Remotive...");

  try {
    const jobs = await fetchRemotiveJobs("", 30);
    let count = 0;

    for (const job of jobs) {
      const jobData = normalizeRemotiveJob(job);
      const skills = extractSkillsFromText(
        `${jobData.title} ${jobData.description}`
      );

      const saved = await prisma.job.upsert({
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
              jobId_skillId: { jobId: saved.id, skillId: skill.id },
            },
            update: {},
            create: { jobId: saved.id, skillId: skill.id },
          });
        }
      }

      count++;
    }

    console.log(`✅ ${count} vagas sincronizadas`);
  } catch (error) {
    console.error("❌ Erro ao sincronizar vagas:", error);
  }
}

async function seedBooks() {
  console.log("🌱 Populando livros do Open Library...");

  const queries = ["programming", "react", "python", "javascript", "devops"];
  let totalCount = 0;

  for (const query of queries) {
    try {
      const books = await fetchOpenLibraryBooks(query, 10);

      for (const doc of books) {
        const bookData = normalizeOpenLibraryBook(doc);
        const skills = extractSkillsFromText(
          `${bookData.title} ${bookData.description ?? ""}`
        );

        const saved = await prisma.book.upsert({
          where: { externalId: bookData.externalId },
          update: {
            title: bookData.title,
            authors: bookData.authors,
            description: bookData.description,
            url: bookData.url,
            thumbnailUrl: bookData.thumbnailUrl,
            language: bookData.language,
            pageCount: bookData.pageCount,
            publishedAt: bookData.publishedAt,
            publisher: bookData.publisher,
            isFree: bookData.isFree,
          },
          create: bookData,
        });

        for (const skillSlug of skills) {
          const skill = await prisma.skill.findUnique({
            where: { slug: skillSlug },
          });
          if (skill) {
            await prisma.bookSkill.upsert({
              where: {
                bookId_skillId: { bookId: saved.id, skillId: skill.id },
              },
              update: {},
              create: { bookId: saved.id, skillId: skill.id },
            });
          }
        }

        totalCount++;
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar livros para "${query}":`, error);
    }
  }

  console.log(`✅ ${totalCount} livros sincronizados`);
}

async function seedAudiobooks() {
  console.log("🌱 Populando audiobooks do LibriVox...");

  try {
    const audiobooks = await fetchLibriVoxAudiobooks("", 20);
    let count = 0;

    for (const book of audiobooks) {
      const bookData = normalizeLibriVoxAudiobook(book);
      const skills = extractSkillsFromText(
        `${bookData.title} ${bookData.description ?? ""}`
      );

      const saved = await prisma.audiobook.upsert({
        where: { externalId: bookData.externalId },
        update: {
          title: bookData.title,
          authors: bookData.authors,
          narrator: bookData.narrator,
          description: bookData.description,
          url: bookData.url,
          thumbnailUrl: bookData.thumbnailUrl,
          language: bookData.language,
          durationMin: bookData.durationMin,
          isFree: bookData.isFree,
        },
        create: bookData,
      });

      for (const skillSlug of skills) {
        const skill = await prisma.skill.findUnique({
          where: { slug: skillSlug },
        });
        if (skill) {
          await prisma.audiobookSkill.upsert({
            where: {
              audiobookId_skillId: { audiobookId: saved.id, skillId: skill.id },
            },
            update: {},
            create: { audiobookId: saved.id, skillId: skill.id },
          });
        }
      }

      count++;
    }

    console.log(`✅ ${count} audiobooks sincronizados`);
  } catch (error) {
    console.error("❌ Erro ao sincronizar audiobooks:", error);
  }
}

async function main() {
  console.log("🚀 Iniciando seed do TechRadar...\n");

  await seedSkills();
  await seedJobs();
  await seedBooks();
  await seedAudiobooks();

  console.log("\n🎉 Seed concluído!");
}

main()
  .catch((error) => {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
