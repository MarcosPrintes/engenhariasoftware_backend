import express, { type Request, type Response } from "express";

import { itemsRouter } from "./routes/items.routes";

// `app` é apenas a configuração do Express.
// Repare que NÃO existe `app.listen()` aqui: quem sobe o servidor é o server.ts.
export const app = express();

// Permite ler corpo JSON nas requisições (POST/PUT).
app.use(express.json());

// Todas as rotas de items ficam sob /api/items.
app.use("/api/items", itemsRouter);

// Rota inexistente -> 404 em JSON (nunca devolver HTML de erro).
// Fica por último: o Express avalia os middlewares na ordem de registro.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});
