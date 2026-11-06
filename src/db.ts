import { JsonDB, Config } from "node-json-db";
import type { Order, Product, User } from "./types";

export const db = new JsonDB(new Config("data/db", true, true, "/"));

export const getUsers = (): Promise<User[]> => db.getObject<User[]>("/users");
export const getProducts = (): Promise<Product[]> =>
  db.getObject<Product[]>("/products");
export const getOrders = (): Promise<Order[]> =>
  db.getObject<Order[]>("/orders");

export const saveProducts = (products: Product[]): Promise<void> =>
  db.push("/products", products);
export const saveOrders = (orders: Order[]): Promise<void> =>
  db.push("/orders", orders);
