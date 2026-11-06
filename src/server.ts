import express from "express";
import cors from "cors";
import { router as ordersRouter } from "./routes/orders";
import { router as productsRouter } from "./routes/products";
import { router as usersRouter } from "./routes/users";

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

// renvoie le serveur HTTP, pour socket.io
const PORT = Number(process.env.PORT) || 3000;
export const server = app.listen(PORT, () =>
  console.log(`http://localhost:${PORT}`),
);
