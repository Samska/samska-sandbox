import { afterEach, describe, expect, it, vi } from "vitest";
import { clearLatestReference, readLatestReference, writeLatestReference } from "./referenceStorage";

const referenceKey = "samska.latest-payment-attempt";
const attemptId = "aaaaaaaa-1111-1111-1111-111111111111";

afterEach(() => {
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});

describe("latest reference storage", () => {
  it("reads and writes a valid attempt UUID", () => {
    writeLatestReference(attemptId);

    expect(window.sessionStorage.getItem(referenceKey)).toBe(attemptId);
    expect(readLatestReference()).toBe(attemptId);

    clearLatestReference();

    expect(readLatestReference()).toBeNull();
  });

  it("ignores tampered or malformed stored values", () => {
    window.sessionStorage.setItem(referenceKey, "not-a-uuid");
    expect(readLatestReference()).toBeNull();

    window.sessionStorage.setItem(referenceKey, "");
    expect(readLatestReference()).toBeNull();
  });

  it("fails safely when browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    expect(readLatestReference()).toBeNull();
    expect(() => writeLatestReference(attemptId)).not.toThrow();
    expect(() => clearLatestReference()).not.toThrow();
  });
});
