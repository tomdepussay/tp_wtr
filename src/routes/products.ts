import { Router } from "express";
import { getProducts } from "../db";

export const router = Router();

router.get("/", async (_req, res) => {
  res.json(await getProducts());
});

router.get("/:id", async (req, res) => {
  const products = await getProducts();
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) {
    res.status(404).json({ error: "Ce produit n'existe pas" });
    return;
  }
  res.json(product);
});
