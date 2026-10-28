/**
 * Integração com a API do Arbeitnow (https://www.arbeitnow.com/api/job-board-api)
 * Retorna vagas remotas em formato normalizado.
 */

export interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  job_types: string[];
  location: string;
  url: string;
  tags: string[];
  created_at: number;
}

export interface ArbeitnowResponse {
  data: ArbeitnowJob[];
}

/**
 * Busca vagas no Arbeitnow.
 */
export async function fetchArbeitnowJobs(
  query: string = "",
  limit: number = 50
): Promise<ArbeitnowJob[]> {
  const url = `https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(query)}&limit=${limit}`;

  const res = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  } as RequestInit);

  if (!res.ok) {
    throw new Error(`Arbeitnow API error: ${res.status}`);
  }

  const data: ArbeitnowResponse = await res.json();
  return data.data;
}

/**
 * Normaliza uma vaga do Arbeitnow para o formato interno.
 */
export function normalizeArbeitnowJob(job: ArbeitnowJob) {
  return {
    externalId: `arbeitnow-${job.slug}`,
    source: "arbeitnow" as const,
    title: job.title,
    company: job.company_name,
    description: job.description,
    url: job.url,
    location: job.location || "Remote",
    isRemote: job.remote,
    jobType: job.job_types?.[0] ?? null,
    salaryMin: null,
    salaryMax: null,
    currency: "EUR",
    postedAt: job.created_at ? new Date(job.created_at * 1000) : null,
    logoUrl: null,
  };
}
