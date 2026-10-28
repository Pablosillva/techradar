import { prisma } from "@/lib/prisma";

/**
 * Busca full-text no Postgres com tsvector e fallback para ILIKE.
 * Retorna IDs de vagas que correspondem ao termo.
 */
export async function searchJobIds(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  try {
    // Tenta full-text search com tsvector
    const results = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Job"
      WHERE to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', ${query})
      AND "isActive" = true
      LIMIT 100
    `;
    return results.map((r) => r.id);
  } catch {
    // Fallback para ILIKE se tsvector não estiver disponível
    const results = await prisma.job.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true },
      take: 100,
    });
    return results.map((r) => r.id);
  }
}

/**
 * Busca IDs de cursos por termo.
 */
export async function searchCourseIds(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  try {
    const results = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Course"
      WHERE to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', ${query})
      LIMIT 100
    `;
    return results.map((r) => r.id);
  } catch {
    const results = await prisma.course.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true },
      take: 100,
    });
    return results.map((r) => r.id);
  }
}

/**
 * Busca IDs de livros por termo.
 */
export async function searchBookIds(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  try {
    const results = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Book"
      WHERE to_tsvector('english', title || ' ' || array_to_string(authors, ' ')) @@ plainto_tsquery('english', ${query})
      LIMIT 100
    `;
    return results.map((r) => r.id);
  } catch {
    const results = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { authors: { has: query } },
        ],
      },
      select: { id: true },
      take: 100,
    });
    return results.map((r) => r.id);
  }
}

/**
 * Busca IDs de audiobooks por termo.
 */
export async function searchAudiobookIds(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  try {
    const results = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Audiobook"
      WHERE to_tsvector('english', title || ' ' || array_to_string(authors, ' ')) @@ plainto_tsquery('english', ${query})
      LIMIT 100
    `;
    return results.map((r) => r.id);
  } catch {
    const results = await prisma.audiobook.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { authors: { has: query } },
        ],
      },
      select: { id: true },
      take: 100,
    });
    return results.map((r) => r.id);
  }
}
