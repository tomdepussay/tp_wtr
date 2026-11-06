import { Router } from "express";
import { getUsers } from "../db";

export const router = Router();

router.get("/", async (_req, res) => {
  res.json(await getUsers());
});
