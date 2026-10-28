import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchOpenLibraryBooks, normalizeOpenLibraryBook } from "@/lib/sources/openlibrary";
import { extractSkillsFromText } from "@/lib/skills/extract";

/**
 * POST /api/sync/books
 * Sincroniza livros da API Open Library.
 */
export async function POST(request: Request) {
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
    const { query = "programming" } = await request.json().catch(() => ({}));

    const books = await fetchOpenLibraryBooks(query, 30);

    let created = 0;

    for (const doc of books) {
      const bookData = normalizeOpenLibraryBook(doc);

      // Extrai skills do título + descrição
      const skills = extractSkillsFromText(
        `${bookData.title} ${bookData.description ?? ""}`
      );

      // Upsert do livro
      const book = await prisma.book.upsert({
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

      // Associa skills
      for (const skillSlug of skills) {
        const skill = await prisma.skill.findUnique({
          where: { slug: skillSlug },
        });
        if (skill) {
          await prisma.bookSkill.upsert({
            where: {
              bookId_skillId: {
                bookId: book.id,
                skillId: skill.id,
              },
            },
            update: {},
            create: {
              bookId: book.id,
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
      total: books.length,
    });
  } catch (error) {
    console.error("Error syncing books:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar livros" },
      { status: 500 }
    );
  }
}
