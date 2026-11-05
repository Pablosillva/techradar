import { describe, expect, it } from "vitest";
import {
  detectFileType,
  maxSizeFor,
} from "../../upload";

describe("upload security (magic number)", () => {
  it("detect PDF by magic number", () => {
    expect(detectFileType(Buffer.from("%PDF-1.4\n%"))).toEqual({
      kind: "pdf",
      mime: "application/pdf",
      ext: "pdf",
    });
  });

  it("detect MP3 by ID3 and MPEG sync", () => {
    expect(detectFileType(Buffer.from("ID3"))).toMatchObject({
      kind: "audio",
      mime: "audio/mpeg",
      ext: "mp3",
    });
    expect(detectFileType(Buffer.from([0xff, 0xfb]))).toMatchObject({
      kind: "audio",
      mime: "audio/mpeg",
      ext: "mp3",
    });
  });

  it("detect FLAC, OGG, WAV and M4A", () => {
    expect(detectFileType(Buffer.from("fLaC"))).toMatchObject({
      kind: "audio",
      mime: "audio/flac",
      ext: "flac",
    });
    expect(detectFileType(Buffer.from("OggS"))).toMatchObject({
      kind: "audio",
      mime: "audio/ogg",
      ext: "ogg",
    });
    const wav = Buffer.alloc(12);
    wav.write("RIFF", 0);
    wav.write("WAVE", 8);
    expect(detectFileType(wav)).toMatchObject({
      kind: "audio",
      mime: "audio/wav",
      ext: "wav",
    });
    const m4a = Buffer.alloc(12);
    m4a.write("\u0000\u0000\u0000\u0018", 0);
    m4a.write("ftyp", 4);
    expect(detectFileType(m4a)).toMatchObject({
      kind: "audio",
      mime: "audio/mp4",
      ext: "m4a",
    });
  });

  it("rejects non-files and XSS-prone extensions", () => {
    expect(detectFileType(Buffer.from("not a real file"))).toBeNull();
    expect(detectFileType(Buffer.from("javascript:alert(1)"))).toBeNull();
    expect(detectFileType(Buffer.from(""))).toBeNull();
    expect(detectFileType(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
  });

  it("returns size limits by kind", () => {
    expect(maxSizeFor("pdf")).toBe(100 * 1024 * 1024);
    expect(maxSizeFor("audio")).toBe(300 * 1024 * 1024);
  });
});
