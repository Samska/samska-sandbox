import { describe, expect, it } from "vitest";
import { pageTitle } from "./pageTitle";

describe("pageTitle", () => {
  it("names each screen and falls back to the store name", () => {
    expect(pageTitle("/")).toBe("Samska Store");
    expect(pageTitle("/checkout")).toBe("Checkout · Samska Store");
    expect(pageTitle("/account")).toBe("Sign in · Samska Store");
    expect(pageTitle("/orders")).toBe("Your orders · Samska Store");
    expect(pageTitle("/orders/abc")).toBe("Order tracking · Samska Store");
    expect(pageTitle("/admin/products")).toBe("Admin products · Samska Store");
    expect(pageTitle("/admin/products/new")).toBe("New product · Samska Store");
    expect(pageTitle("/admin/products/p1/edit")).toBe("Edit product · Samska Store");
    expect(pageTitle("/admin/orders")).toBe("Admin orders · Samska Store");
    expect(pageTitle("/admin/operations")).toBe("Operations · Samska Store");
    expect(pageTitle("/somewhere/else")).toBe("Samska Store");
  });
});
