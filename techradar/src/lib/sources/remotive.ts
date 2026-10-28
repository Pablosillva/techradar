/**
 * Integração com a API do Remotive (https://remotive.com/api/remote-jobs)
 * Retorna vagas remotas em formato normalizado.
 */

export interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  description: string;
  url: string;
  candidate_required_location: string;
  job_type: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  published_at: string;
  company_logo?: string;
  tags?: string[];
}

export interface RemotiveResponse {
  "job-count": number;
  jobs: RemotiveJob[];
}

/**
 * Busca vagas remotas no Remotive.
 */
export async function fetchRemotiveJobs(
  query: string = "",
  limit: number = 50
): Promise<RemotiveJob[]> {
  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=${limit}`;

  const res = await fetch(url, {
    cache: "force-cache",
    next: { revalidate: 3600 },
  } as RequestInit);

  if (!res.ok) {
    throw new Error(`Remotive API error: ${res.status}`);
  }

  const data: RemotiveResponse = await res.json();
  return data.jobs;
}

/**
 * Normaliza uma vaga do Remotive para o formato interno.
 */
export function normalizeRemotiveJob(job: RemotiveJob) {
  return {
    externalId: `remotive-${job.id}`,
    source: "remotive" as const,
    title: job.title,
    company: job.company_name,
    description: job.description,
    url: job.url,
    location: job.candidate_required_location || "Remote",
    isRemote: true,
    jobType: job.job_type,
    salaryMin: job.salary_min ?? null,
    salaryMax: job.salary_max ?? null,
    currency: job.salary_currency ?? "USD",
    postedAt: job.published_at ? new Date(job.published_at) : null,
    logoUrl: job.company_logo ?? null,
  };
}
