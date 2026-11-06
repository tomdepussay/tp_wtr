import express from "express";
import cors from "cors";
import { router as ordersRouter } from "./routes/orders";
import { router as productsRouter } from "./routes/products";
import { router as usersRouter } from "./routes/users";
import { clients } from "./sse";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.status(200).json({ ok: "ok" });
});

app.use("/users", usersRouter);
app.use("/products", productsRouter);
app.use("/orders", ordersRouter);

app.get("/stream", (_req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  clients.add(res);
  res.on("close", () => clients.delete(res));
});

// renvoie le serveur HTTP, pour socket.io
const PORT = Number(process.env.PORT) || 3000;
export const server = app.listen(PORT, () =>
  console.log(`http://localhost:${PORT}`),
);
