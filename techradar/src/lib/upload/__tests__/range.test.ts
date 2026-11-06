import { describe, expect, it } from "vitest";
import { parseByteRange } from "../range";

describe("parseByteRange", () => {
  it("interpreta range fechado", () => {
    expect(parseByteRange("bytes=0-99", 1000)).toEqual({ start: 0, end: 99 });
  });

  it("interpreta range aberto até o fim", () => {
    expect(parseByteRange("bytes=900-", 1000)).toEqual({ start: 900, end: 999 });
  });

  it("interpreta sufixo (últimos N bytes)", () => {
    expect(parseByteRange("bytes=-100", 1000)).toEqual({ start: 900, end: 999 });
  });

  it("limita o fim ao tamanho do arquivo", () => {
    expect(parseByteRange("bytes=900-5000", 1000)).toEqual({ start: 900, end: 999 });
  });

  it("aceita sufixo maior que o arquivo", () => {
    expect(parseByteRange("bytes=-5000", 1000)).toEqual({ start: 0, end: 999 });
  });

  it("rejeita início além do arquivo", () => {
    expect(parseByteRange("bytes=1000-", 1000)).toBeNull();
  });

  it("rejeita range invertido", () => {
    expect(parseByteRange("bytes=500-100", 1000)).toBeNull();
  });

  it("rejeita múltiplos ranges", () => {
    expect(parseByteRange("bytes=0-10,20-30", 1000)).toBeNull();
  });

  it("rejeita unidade ou formato inválido", () => {
    expect(parseByteRange("items=0-10", 1000)).toBeNull();
    expect(parseByteRange("bytes=-", 1000)).toBeNull();
  });

  it("rejeita arquivo vazio", () => {
    expect(parseByteRange("bytes=0-10", 0)).toBeNull();
  });
});
