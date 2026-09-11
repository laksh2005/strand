import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/index";

describe("privacy permissions", () => {
  it("returns events for an enabled category", async () => {
    await request(app).post("/events").send({ type: "location", title: "Park", content: "x" });

    const res = await request(app).get("/events?type=location");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  it("excludes a disabled category from list and denies direct access", async () => {
    const created = await request(app).post("/events").send({ type: "location", title: "Park", content: "x" });

    await request(app).put("/permissions/location").send({ enabled: false });

    const list = await request(app).get("/events");
    expect(list.body.events.some((e: { type: string }) => e.type === "location")).toBe(false);

    const typeFiltered = await request(app).get("/events?type=location");
    expect(typeFiltered.body.total).toBe(0);

    const direct = await request(app).get(`/events/${created.body.id}`);
    expect(direct.status).toBe(403);
  });

  it("re-enabling a permission immediately affects later requests", async () => {
    await request(app).post("/events").send({ type: "note", title: "Idea", content: "x" });

    await request(app).put("/permissions/note").send({ enabled: false });
    const denied = await request(app).get("/events?type=note");
    expect(denied.body.total).toBe(0);

    await request(app).put("/permissions/note").send({ enabled: true });
    const allowed = await request(app).get("/events?type=note");
    expect(allowed.body.total).toBe(1);
  });
});
