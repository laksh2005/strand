import { Router } from "express";
import { EventType } from "@prisma/client";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler";
import { getCurrentUserId } from "../lib/currentUser";
import { createEvent, deleteEvent, getEventById, listEvents } from "../services/eventService";

const router = Router();

const eventTypeSchema = z.nativeEnum(EventType);

const listQuerySchema = z.object({
  type: eventTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const createBodySchema = z.object({
  type: eventTypeSchema,
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  timestamp: z.coerce.date().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);
    const userId = await getCurrentUserId();
    const { events, total } = await listEvents({ userId, ...query });
    res.json({ events, total, limit: query.limit, offset: query.offset });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = await getCurrentUserId();
    const event = await getEventById(userId, req.params.id);
    res.json(event);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createBodySchema.parse(req.body);
    const userId = await getCurrentUserId();
    const event = await createEvent({
      userId,
      type: body.type,
      title: body.title,
      content: body.content,
      timestamp: body.timestamp ?? new Date(),
    });
    res.status(201).json(event);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = await getCurrentUserId();
    await deleteEvent(userId, req.params.id);
    res.status(204).send();
  })
);

export default router;
