import { Router } from "express";
import {
  getOrders,
  getProducts,
  getUsers,
  saveOrders,
  saveProducts,
} from "../db";
import type { Order } from "../types";

export const router = Router();

router.get("/", async (_req, res) => {
  res.json(await getOrders());
});

router.get("/:id", async (req, res) => {
  const orders = await getOrders();
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }
  res.json(order);
});

router.post("/", async (req, res) => {
  const body: unknown = req.body;
  if (typeof body !== "object" || body === null) {
    res.status(400).json({ error: "Body JSON manquant" });
    return;
  }

  const { userId, productId, quantity } = body as Record<string, unknown>;
  if (
    typeof userId !== "number" ||
    !Number.isInteger(userId) ||
    typeof productId !== "number" ||
    !Number.isInteger(productId) ||
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    res.status(400).json({
      error: "userId, productId et quantity doivent être des entiers (quantity > 0)",
    });
    return;
  }

  const users = await getUsers();
  if (!users.some((u) => u.id === userId)) {
    res.status(404).json({ error: "Client introuvable" });
    return;
  }
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) {
    res.status(404).json({ error: "Produit introuvable" });
    return;
  }

  if (product.stock < quantity) {
    res.status(409).json({ error: "Stock insuffisant" });
    return;
  }

  product.stock -= quantity;
  await saveProducts(products);

  const orders = await getOrders();
  const order: Order = {
    id: Math.max(0, ...orders.map((o) => o.id)) + 1,
    userId,
    productId,
    quantity,
    status: "preparing",
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  await saveOrders(orders);

  res.status(201).json(order);
});

