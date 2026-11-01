import { Router, type Request, type Response } from "express";

// Um Router é um "mini app": agrupa as rotas de um recurso.
// Ele é montado no app.ts sob o caminho /api/items.
// Repare que aqui os caminhos são relativos ("/", "/:id"),
// então "/" vira /api/items e "/:id" vira /api/items/:id.
export const itemsRouter = Router();

// GET /api/items — listar (simulado)
itemsRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// POST /api/items — criar (simulado)
// 201 = Created, a convenção HTTP para recurso criado.
itemsRouter.post("/", (_req: Request, res: Response) => {
  res.status(201).json({ status: "ok" });
});

// PUT /api/items/:id — atualizar (simulado)
// ":id" é um parâmetro de rota; existe para a URL ser realista,
// mas ainda não é usado porque não há banco de dados.
itemsRouter.put("/:id", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// DELETE /api/items/:id — remover (simulado)
itemsRouter.delete("/:id", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});
