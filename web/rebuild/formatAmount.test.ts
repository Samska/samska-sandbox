import { describe, expect, it } from "vitest";
import { formatAmount } from "./formatAmount";

describe("formatAmount", () => {
  it("uses en-US grouping with two decimal places and no currency symbol", () => {
    expect(formatAmount(12.5)).toBe("12.50");
    expect(formatAmount(0)).toBe("0.00");
    expect(formatAmount(1234.5)).toBe("1,234.50");
    expect(formatAmount(1000000)).toBe("1,000,000.00");
  });

  it("rounds for display only, leaving the wire value untouched", () => {
    expect(formatAmount(0.001)).toBe("0.00");
    expect(formatAmount(12.345)).toBe("12.35");
    expect(formatAmount(12.344)).toBe("12.34");
  });
});