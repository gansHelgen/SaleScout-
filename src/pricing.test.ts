import { describe, expect, it } from "vitest";
import { calculatePrice } from "./pricing.ts";
import type { Product } from "./types.ts";

function product(overrides: Partial<Product> = {}): Product {
  return {
    sku: "SKU-1",
    name: "Test product",
    myPrice: 120,
    minPrice: 80,
    maxPrice: 150,
    step: 5,
    competitors: [{ seller: "Seller", price: 100, inStock: true }],
    ...overrides,
  };
}

describe("calculatePrice", () => {
  it("undercuts the lowest in-stock competitor and preserves old price", () => {
    expect(
      calculatePrice(
        product({
          myPrice: 130,
          competitors: [
            { seller: "Unavailable", price: 50, inStock: false },
            { seller: "Seller A", price: 101, inStock: true },
            { seller: "Seller B", price: 100, inStock: true },
          ],
        }),
      ),
    ).toEqual({ sku: "SKU-1", oldPrice: 130, newPrice: 95, reason: "UNDERCUT" });
  });

  it("floors fractional candidate prices", () => {
    expect(
      calculatePrice(
        product({
          step: 0.5,
          competitors: [{ seller: "Seller", price: 349999.9, inStock: true }],
          minPrice: 300000,
          maxPrice: 400000,
        }),
      ).newPrice,
    ).toBe(349999);
  });

  it("clamps candidate below minimum", () => {
    expect(
      calculatePrice(
        product({ minPrice: 100, competitors: [{ seller: "Seller", price: 90, inStock: true }] }),
      ),
    ).toEqual({ sku: "SKU-1", oldPrice: 120, newPrice: 100, reason: "AT_MIN" });
  });

  it("clamps candidate above maximum", () => {
    expect(
      calculatePrice(
        product({ maxPrice: 90, competitors: [{ seller: "Seller", price: 100, inStock: true }] }),
      ),
    ).toEqual({ sku: "SKU-1", oldPrice: 120, newPrice: 90, reason: "AT_MAX" });
  });

  it("uses maximum price when no competitor is in stock", () => {
    expect(
      calculatePrice(
        product({
          competitors: [{ seller: "Unavailable", price: 50, inStock: false }],
        }),
      ),
    ).toEqual({ sku: "SKU-1", oldPrice: 120, newPrice: 150, reason: "NO_COMPETITORS" });
  });

  it("returns the candidate unchanged when it equals a boundary", () => {
    expect(
      calculatePrice(
        product({ step: 0, minPrice: 100, maxPrice: 100, competitors: [{ seller: "Seller", price: 100, inStock: true }] }),
      ).reason,
    ).toBe("UNDERCUT");
  });
});
