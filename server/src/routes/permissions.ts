import { Router } from "express";
import { EventType } from "@prisma/client";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { getCurrentUserId } from "../lib/currentUser";
import { listPermissions, setPermission } from "../services/permissionService";

const router = Router();

const updateBodySchema = z.object({
  enabled: z.boolean(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = await getCurrentUserId();
    const permissions = await listPermissions(userId);
    res.json(permissions);
  })
);

router.put(
  "/:type",
  asyncHandler(async (req, res) => {
    const type = z.nativeEnum(EventType).parse(req.params.type);
    const { enabled } = updateBodySchema.parse(req.body);
    const userId = await getCurrentUserId();
    const permission = await setPermission(userId, type, enabled);
    res.json(permission);
  })
);

export default router;
