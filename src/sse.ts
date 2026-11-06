import type { Response } from "express";

export const clients = new Set<Response>();

export const orderClients = new Map<number, Set<Response>>();

let id = 0;
export function broadcast(event: string, data: unknown, orderId?: number) {
  const msg = `id: ${++id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(msg);
  if (orderId !== undefined) {
    for (const res of orderClients.get(orderId) ?? []) res.write(msg);
  }
}
