import { describe, it, expect } from "vitest";
import { normalizeOpenLibraryBook } from "../openlibrary";

describe("normalizeOpenLibraryBook", () => {
  it("normaliza um livro do Open Library", () => {
    const raw = {
      key: "/works/OL12345W",
      title: "React in Action",
      author_name: ["Thomas Abraham"],
      first_publish_year: 2020,
      number_of_pages_median: 300,
      publisher: ["Manning"],
      language: ["eng"],
      cover_i: 12345,
      isbn: ["9781234567890"],
      subject: ["React", "JavaScript", "Web Development"],
    };

    const result = normalizeOpenLibraryBook(raw);

    expect(result.externalId).toBe("OL12345W");
    expect(result.source).toBe("openlibrary");
    expect(result.title).toBe("React in Action");
    expect(result.authors).toEqual(["Thomas Abraham"]);
    expect(result.language).toBe("eng");
    expect(result.pageCount).toBe(300);
    expect(result.isFree).toBe(true);
    expect(result.thumbnailUrl).toContain("12345");
  });

  it("trata valores ausentes", () => {
    const raw = {
      key: "/works/OL999W",
      title: "Unknown Book",
    };

    const result = normalizeOpenLibraryBook(raw);

    expect(result.authors).toEqual([]);
    expect(result.description).toBeNull();
    expect(result.thumbnailUrl).toBeNull();
  });
});
