import express, { type ErrorRequestHandler } from "express";
import { calculatePrice } from "../src/pricing.ts";
import type { Product } from "../src/types.ts";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json());

function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

  const product = value as Record<string, unknown>;
  if (
    typeof product.sku !== "string" ||
    typeof product.name !== "string" ||
    typeof product.myPrice !== "number" ||
    !Number.isFinite(product.myPrice) ||
    typeof product.minPrice !== "number" ||
    !Number.isFinite(product.minPrice) ||
    typeof product.maxPrice !== "number" ||
    !Number.isFinite(product.maxPrice) ||
    typeof product.step !== "number" ||
    !Number.isFinite(product.step) ||
    product.myPrice < 0 ||
    product.minPrice < 0 ||
    product.maxPrice < 0 ||
    product.step < 0 ||
    product.minPrice > product.maxPrice ||
    !Array.isArray(product.competitors)
  ) {
    return false;
  }

  return product.competitors.every((competitor: unknown) => {
    if (typeof competitor !== "object" || competitor === null || Array.isArray(competitor)) {
      return false;
    }
    const item = competitor as Record<string, unknown>;
    return (
      typeof item.seller === "string" &&
      typeof item.price === "number" &&
      Number.isFinite(item.price) &&
      item.price >= 0 &&
      typeof item.inStock === "boolean"
    );
  });
}

app.post("/reprice", (request, response) => {
  const body: unknown = request.body;
  if (!Array.isArray(body)) {
    response.status(400).json({ error: "Request body must be an array of valid products." });
    return;
  }

  const products = body.filter(isProduct);
  if (products.length !== body.length) {
    response.status(400).json({ error: "Request body must be an array of valid products." });
    return;
  }

  response.json(products.map(calculatePrice));
});

const handleJsonError: ErrorRequestHandler = (error, _request, response, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ error: "Request body must contain valid JSON." });
    return;
  }
  next(error);
};

app.use(handleJsonError);

app.listen(port, () => {
  console.log(`SaleScout API listening on http://localhost:${port}`);
});
