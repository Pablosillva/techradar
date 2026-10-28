/**
 * Integração com a API do LibriVox (https://librivox.org/api/feed/audiobooks/)
 * Retorna audiobooks de domínio público em formato normalizado.
 */

export interface LibriVoxBook {
  id: string;
  title: string;
  description: string;
  url_librivox: string;
  url_iarchive?: string;
  language: string;
  copyright_year?: string;
  num_sections?: string;
  totaltime?: string;
  totalsecs?: number;
  authors?: Array<{
    first_name: string;
    last_name: string;
    birth_year?: string;
    death_year?: string;
  }>;
}

export interface LibriVoxResponse {
  books: LibriVoxBook[];
}

/**
 * Busca audiobooks no LibriVox.
 */
export async function fetchLibriVoxAudiobooks(
  query: string = "",
  limit: number = 20
): Promise<LibriVoxBook[]> {
  const params = new URLSearchParams({
    format: "json",
    limit: String(limit),
  });
  if (query) {
    params.set("q", query);
  }

  const url = `https://librivox.org/api/feed/audiobooks/?${params.toString()}`;

  const res = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: 86400 },
  } as RequestInit);

  if (!res.ok) {
    throw new Error(`LibriVox API error: ${res.status}`);
  }

  const data: LibriVoxResponse = await res.json();
  return data.books;
}

/**
 * Normaliza um audiobook do LibriVox para o formato interno.
 */
export function normalizeLibriVoxAudiobook(book: LibriVoxBook) {
  const authors = book.authors?.map((a) => `${a.first_name} ${a.last_name}`.trim()) ?? [];

  return {
    externalId: `librivox-${book.id}`,
    source: "librivox" as const,
    title: book.title,
    authors,
    narrator: null,
    description: book.description ?? null,
    url: book.url_librivox,
    thumbnailUrl: null,
    language: book.language ?? "en",
    durationMin: book.totalsecs ? Math.round(book.totalsecs / 60) : null,
    isFree: true, // LibriVox = domínio público
  };
}
