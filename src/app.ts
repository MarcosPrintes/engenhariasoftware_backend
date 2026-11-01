import express, { type Request, type Response } from "express";

// `app` é apenas a configuração do Express.
// Repare que NÃO existe `app.listen()` aqui: quem sobe o servidor é o server.ts.
export const app = express();

// Permite ler corpo JSON nas requisições (POST/PUT usados nas próximas fases).
app.use(express.json());

// Rota raiz, usada só para confirmar que o servidor está no ar.
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Rota inexistente -> 404 em JSON (nunca devolver HTML de erro).
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "not found" });
});
