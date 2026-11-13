import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app";

// Supertest recebe o `app` diretamente, sem abrir porta.
// Por isso `app.ts` existe separado de `server.ts` desde a fase 01.

describe("GET /api/items", () => {
  it("responde 200 com JSON { status: 'ok' }", async () => {
    const response = await request(app).get("/api/items");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("POST /api/items", () => {
  it("responde 201 com JSON { status: 'ok' }", async () => {
    const response = await request(app)
      .post("/api/items")
      .send({ name: "item de exemplo" });

    expect(response.status).toBe(201);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("PUT /api/items/:id", () => {
  it("responde 200 com JSON { status: 'ok' }", async () => {
    const response = await request(app)
      .put("/api/items/1")
      .send({ name: "item atualizado" });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("DELETE /api/items/:id", () => {
  it("responde 200 com JSON { status: 'ok' }", async () => {
    const response = await request(app).delete("/api/items/1");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/application\/json/);
    expect(response.body).toEqual({ status: "ok" });
  });
});
