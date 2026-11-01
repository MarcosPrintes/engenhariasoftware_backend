import { app } from "./app";

// A Render injeta a variável PORT. Localmente ela não existe, então usamos 3000.
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
