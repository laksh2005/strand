import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/index";

describe("audit log", () => {
  it("records event creation, deletion, and access-denied actions", async () => {
    const created = await request(app).post("/events").send({ type: "location", title: "Gym", content: "x" });

    await request(app).put("/permissions/location").send({ enabled: false });
    await request(app).get(`/events/${created.body.id}`);

    await request(app).put("/permissions/location").send({ enabled: true });
    await request(app).delete(`/events/${created.body.id}`);

    const log = await request(app).get("/audit-log?limit=50");
    expect(log.status).toBe(200);

    const actions = log.body.entries.map((e: { action: string }) => e.action);
    expect(actions).toContain("EVENT_CREATED");
    expect(actions).toContain("PERMISSION_CHANGED");
    expect(actions).toContain("EVENT_ACCESS_DENIED");
    expect(actions).toContain("EVENT_DELETED");
  });

  it("does not expose any write endpoint", async () => {
    const res = await request(app).post("/audit-log").send({});
    expect(res.status).toBe(404);
  });
});
