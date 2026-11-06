import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.status(200).json({ ok: "ok" });
});

// renvoie le serveur HTTP, pour socket.io
const PORT = Number(process.env.PORT) || 3000;
export const server = app.listen(PORT, () =>
  console.log(`http://localhost:${PORT}`),
);
