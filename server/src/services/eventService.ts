import { EventType } from "@prisma/client";
import { prisma } from "../db";
import { writeAuditLog } from "../lib/audit";
import { HttpError } from "../middleware/errorHandler";
import { getEnabledTypes } from "./permissionService";

export async function listEvents(params: {
  userId: string;
  type?: EventType;
  limit: number;
  offset: number;
}) {
  const enabledTypes = await getEnabledTypes(params.userId);

  const allowedTypes = params.type
    ? enabledTypes.filter((t) => t === params.type)
    : enabledTypes;

  if (allowedTypes.length === 0) {
    await writeAuditLog({
      userId: params.userId,
      action: "EVENTS_LISTED",
      result: "SUCCESS",
      eventType: params.type,
    });
    return { events: [], total: 0 };
  }

  const where = { userId: params.userId, type: { in: allowedTypes } };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: params.limit,
      skip: params.offset,
    }),
    prisma.event.count({ where }),
  ]);

  await writeAuditLog({
    userId: params.userId,
    action: "EVENTS_LISTED",
    result: "SUCCESS",
    eventType: params.type,
  });

  return { events, total };
}

export async function getEventById(userId: string, id: string) {
  const event = await prisma.event.findFirst({ where: { id, userId } });
  if (!event) {
    throw new HttpError(404, "Event not found");
  }

  const enabledTypes = await getEnabledTypes(userId);
  if (!enabledTypes.includes(event.type)) {
    await writeAuditLog({
      userId,
      action: "EVENT_ACCESS_DENIED",
      result: "DENIED",
      eventType: event.type,
    });
    throw new HttpError(403, `Access to '${event.type}' events is disabled`);
  }

  return event;
}

export async function createEvent(params: {
  userId: string;
  type: EventType;
  title: string;
  content: string;
  timestamp: Date;
}) {
  const event = await prisma.event.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      content: params.content,
      timestamp: params.timestamp,
    },
  });

  await writeAuditLog({
    userId: params.userId,
    action: "EVENT_CREATED",
    result: "SUCCESS",
    eventType: event.type,
  });

  return event;
}

export async function deleteEvent(userId: string, id: string) {
  const event = await prisma.event.findFirst({ where: { id, userId } });
  if (!event) {
    throw new HttpError(404, "Event not found");
  }

  await prisma.event.delete({ where: { id } });

  await writeAuditLog({
    userId,
    action: "EVENT_DELETED",
    result: "SUCCESS",
    eventType: event.type,
  });
}
