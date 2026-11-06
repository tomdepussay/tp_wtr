import { Router, type Response } from "express";
import {
  getOrders,
  getProducts,
  getUsers,
  saveOrders,
  saveProducts,
} from "../db";
import { broadcast, orderClients } from "../sse";
import type { Order, Status } from "../types";

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

router.get("/:id/stream", async (req, res) => {
  const orders = await getOrders();
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) {
    res.status(404).json({ error: "Commande introuvable" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  const subscribers = orderClients.get(order.id) ?? new Set<Response>();
  orderClients.set(order.id, subscribers);
  subscribers.add(res);
  res.on("close", () => subscribers.delete(res));
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
  broadcast("stock-changed", product);

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
  broadcast("order-created", order, order.id);

  res.status(201).json(order);
});

const NEXT_STATUS: Record<Status, Status | null> = {
  preparing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

async function deliver(id: number): Promise<void> {
  const orders = await getOrders();
  const order = orders.find((o) => o.id === id);
  if (order?.status !== "shipped") {
    return;
  }
  order.status = "delivered";
  await saveOrders(orders);
  broadcast("order-status-changed", order, order.id);
}

router.post("/:id/nextStatus", async (req, res) => {
  const orders = await getOrders();
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) {
    res.status(404).json({ error: "La commande n'existe pas" });
    return;
  }

  const next = NEXT_STATUS[order.status];
  if (!next) {
    res.status(409).json({ error: "Cette commande ne peut pas changer de statut" });
    return;
  }

  order.status = next;
  await saveOrders(orders);
  broadcast("order-status-changed", order, order.id);

  if (next === "shipped") {
    setTimeout(() => deliver(order.id), 20000);
  }

  res.json(order);
});

router.post("/:id/cancel", async (req, res) => {
  const orders = await getOrders();
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) {
    res.status(404).json({ error: "La commande n'existe pas" });
    return;
  }

  if (order.status !== "preparing") {
    res.status(409).json({
      error: "Seule une commande en préparation peut être annulée",
    });
    return;
  }

  const products = await getProducts();
  const product = products.find((p) => p.id === order.productId);
  if (product) {
    product.stock += order.quantity;
    await saveProducts(products);
    broadcast("stock-changed", product);
  }

  order.status = "cancelled";
  await saveOrders(orders);
  broadcast("order-cancelled", order, order.id);

  res.json(order);
});
