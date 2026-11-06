import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(cors());

// renvoie le serveur HTTP, pour socket.io
const PORT = Number(process.env.PORT) || 3000;
export const server = app.listen(PORT, () =>
  console.log(`http://localhost:${PORT}`),
);
