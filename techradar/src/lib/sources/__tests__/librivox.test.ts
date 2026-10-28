import { describe, it, expect } from "vitest";
import { normalizeLibriVoxAudiobook } from "../librivox";

describe("normalizeLibriVoxAudiobook", () => {
  it("normaliza um audiobook do LibriVox", () => {
    const raw = {
      id: "12345",
      title: "The Art of Programming",
      description: "A classic programming book",
      url_librivox: "https://librivox.org/the-art-of-programming",
      language: "English",
      copyright_year: "2020",
      num_sections: "10",
      totalsecs: 3600,
      authors: [
        {
          first_name: "John",
          last_name: "Doe",
          birth_year: "1970",
          death_year: "2020",
        },
      ],
    };

    const result = normalizeLibriVoxAudiobook(raw);

    expect(result.externalId).toBe("librivox-12345");
    expect(result.source).toBe("librivox");
    expect(result.title).toBe("The Art of Programming");
    expect(result.authors).toEqual(["John Doe"]);
    expect(result.language).toBe("English");
    expect(result.durationMin).toBe(60);
    expect(result.isFree).toBe(true);
  });

  it("trata valores ausentes", () => {
    const raw = {
      id: "999",
      title: "Unknown Audiobook",
      description: "Test",
      url_librivox: "https://librivox.org/test",
      language: "English",
    };

    const result = normalizeLibriVoxAudiobook(raw);

    expect(result.authors).toEqual([]);
    expect(result.description).toBe("Test");
    expect(result.durationMin).toBeNull();
  });
});
