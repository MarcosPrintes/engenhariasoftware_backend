import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app";

// Supertest recebe o `app` do Express diretamente, sem abrir porta.
// É por isso que `app.ts` existe separado de `server.ts`.
describe("GET /", () => {
  it("responde 200 com JSON { status: 'ok' }", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("rota inexistente", () => {
  it("responde 404 com JSON { error: 'not found' }", async () => {
    const response = await request(app).get("/rota-que-nao-existe");

    expect(response.status).toBe(404);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ error: "not found" });
  });
});
