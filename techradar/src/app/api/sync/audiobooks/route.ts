import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchLibriVoxAudiobooks, normalizeLibriVoxAudiobook } from "@/lib/sources/librivox";
import { extractSkillsFromText } from "@/lib/skills/extract";

/**
 * POST /api/sync/audiobooks
 * Sincroniza audiobooks da API LibriVox.
 */
export async function POST(request: Request) {
  try {
    const { query = "" } = await request.json().catch(() => ({}));

    const audiobooks = await fetchLibriVoxAudiobooks(query, 30);

    let created = 0;

    for (const book of audiobooks) {
      const bookData = normalizeLibriVoxAudiobook(book);

      // Extrai skills do título + descrição
      const skills = extractSkillsFromText(
        `${bookData.title} ${bookData.description ?? ""}`
      );

      // Upsert do audiobook
      const audiobook = await prisma.audiobook.upsert({
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

      // Associa skills
      for (const skillSlug of skills) {
        const skill = await prisma.skill.findUnique({
          where: { slug: skillSlug },
        });
        if (skill) {
          await prisma.audiobookSkill.upsert({
            where: {
              audiobookId_skillId: {
                audiobookId: audiobook.id,
                skillId: skill.id,
              },
            },
            update: {},
            create: {
              audiobookId: audiobook.id,
              skillId: skill.id,
            },
          });
        }
      }

      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      total: audiobooks.length,
    });
  } catch (error) {
    console.error("Error syncing audiobooks:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar audiobooks" },
      { status: 500 }
    );
  }
}
