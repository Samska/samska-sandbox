import { describe, expect, it } from "vitest";
import { formatAmount } from "./formatAmount";

describe("formatAmount", () => {
  it("shows the currency symbol and two decimal places", () => {
    expect(formatAmount(12.5)).toBe("$12.50");
    expect(formatAmount(0)).toBe("$0.00");
  });

  it("groups large amounts", () => {
    expect(formatAmount(1249.99)).toBe("$1,249.99");
    expect(formatAmount(1234567.5)).toBe("$1,234,567.50");
  });
});
