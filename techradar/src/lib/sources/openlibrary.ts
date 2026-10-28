/**
 * Integração com a API do Open Library (https://openlibrary.org/developers/api)
 * Retorna livros técnicos em formato normalizado.
 */

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  publisher?: string[];
  language?: string[];
  cover_i?: number;
  isbn?: string[];
  subject?: string[];
}

export interface OpenLibraryResponse {
  numFound: number;
  docs: OpenLibraryDoc[];
}

/**
 * Busca livros no Open Library.
 */
export async function fetchOpenLibraryBooks(
  query: string,
  limit: number = 20
): Promise<OpenLibraryDoc[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&mode=everything`;

  const res = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: 86400 },
  } as RequestInit);

  if (!res.ok) {
    throw new Error(`Open Library API error: ${res.status}`);
  }

  const data: OpenLibraryResponse = await res.json();
  return data.docs;
}

/**
 * Normaliza um livro do Open Library para o formato interno.
 */
export function normalizeOpenLibraryBook(doc: OpenLibraryDoc) {
  const coverUrl = doc.cover_i
    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
    : null;

  return {
    externalId: doc.key.replace("/works/", ""),
    source: "openlibrary" as const,
    title: doc.title,
    authors: doc.author_name ?? [],
    description: doc.subject?.slice(0, 5).join(", ") ?? null,
    url: `https://openlibrary.org${doc.key}`,
    thumbnailUrl: coverUrl,
    language: doc.language?.[0] ?? "en",
    pageCount: doc.number_of_pages_median ?? null,
    publishedAt: doc.first_publish_year
      ? new Date(doc.first_publish_year, 0, 1)
      : null,
    publisher: doc.publisher?.[0] ?? null,
    isFree: true, // Open Library = domínio público
  };
}
