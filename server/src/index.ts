import "dotenv/config";
import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import eventsRouter from "./routes/events";
import permissionsRouter from "./routes/permissions";
import auditLogRouter from "./routes/auditLog";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/events", eventsRouter);
app.use("/permissions", permissionsRouter);
app.use("/audit-log", auditLogRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);

if (require.main === module) {
  const port = process.env.PORT ?? 4000;
  app.listen(port, () => console.log(`Strand API listening on port ${port}`));
}
