import { describe, it, expect } from "vitest";
import { normalizeRemotiveJob } from "../remotive";

describe("normalizeRemotiveJob", () => {
  it("normaliza uma vaga do Remotive", () => {
    const raw = {
      id: 12345,
      title: "Senior React Developer",
      company_name: "Acme Inc",
      description: "<p>We need a React expert</p>",
      url: "https://remotive.com/remote-jobs/software-dev/senior-react-developer-12345",
      candidate_required_location: "Remote",
      job_type: "full-time",
      salary_min: 8000,
      salary_max: 12000,
      salary_currency: "USD",
      published_at: "2026-10-15T10:00:00Z",
      company_logo: "https://example.com/logo.png",
      tags: ["react", "typescript"],
    };

    const result = normalizeRemotiveJob(raw);

    expect(result.externalId).toBe("remotive-12345");
    expect(result.source).toBe("remotive");
    expect(result.title).toBe("Senior React Developer");
    expect(result.company).toBe("Acme Inc");
    expect(result.isRemote).toBe(true);
    expect(result.salaryMin).toBe(8000);
    expect(result.salaryMax).toBe(12000);
  });

  it("trata valores ausentes", () => {
    const raw = {
      id: 999,
      title: "Developer",
      company_name: "Test Co",
      description: "Test",
      url: "https://example.com",
      candidate_required_location: "",
      job_type: "",
      published_at: "2026-01-01T00:00:00Z",
    };

    const result = normalizeRemotiveJob(raw);

    expect(result.salaryMin).toBeNull();
    expect(result.salaryMax).toBeNull();
    expect(result.logoUrl).toBeNull();
  });
});
