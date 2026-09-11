import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { getCurrentUserId } from "../lib/currentUser";
import { prisma } from "../db";

const router = Router();

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const userId = await getCurrentUserId();
    const where = { userId };

    const [entries, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ entries, total, limit: query.limit, offset: query.offset });
  })
);

export default router;
