import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/index";

describe("events", () => {
  it("creates an event and fetches it by id", async () => {
    const create = await request(app).post("/events").send({
      type: "note",
      title: "Test note",
      content: "Hello world",
    });

    expect(create.status).toBe(201);
    expect(create.body.id).toBeDefined();

    const get = await request(app).get(`/events/${create.body.id}`);
    expect(get.status).toBe(200);
    expect(get.body.title).toBe("Test note");
  });

  it("filters by type and paginates", async () => {
    for (let i = 0; i < 3; i++) {
      await request(app).post("/events").send({ type: "note", title: `Note ${i}`, content: "x" });
    }
    await request(app).post("/events").send({ type: "location", title: "Loc", content: "x" });

    const filtered = await request(app).get("/events?type=note");
    expect(filtered.status).toBe(200);
    expect(filtered.body.total).toBe(3);
    expect(filtered.body.events.every((e: { type: string }) => e.type === "note")).toBe(true);

    const paginated = await request(app).get("/events?limit=2&offset=0");
    expect(paginated.body.events).toHaveLength(2);
    expect(paginated.body.total).toBe(4);
  });

  it("returns 400 for an invalid type filter", async () => {
    const res = await request(app).get("/events?type=bogus");
    expect(res.status).toBe(400);
  });

  it("deletes an event", async () => {
    const create = await request(app).post("/events").send({ type: "note", title: "Bye", content: "x" });
    const del = await request(app).delete(`/events/${create.body.id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/events/${create.body.id}`);
    expect(get.status).toBe(404);
  });
});
