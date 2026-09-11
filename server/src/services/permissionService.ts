import { EventType } from "@prisma/client";
import { prisma } from "../db";
import { writeAuditLog } from "../lib/audit";

export async function getEnabledTypes(userId: string): Promise<EventType[]> {
  const permissions = await prisma.permission.findMany({ where: { userId, enabled: true } });
  return permissions.map((p) => p.type);
}

export async function listPermissions(userId: string) {
  return prisma.permission.findMany({ where: { userId }, orderBy: { type: "asc" } });
}

export async function setPermission(userId: string, type: EventType, enabled: boolean) {
  const permission = await prisma.permission.upsert({
    where: { userId_type: { userId, type } },
    update: { enabled },
    create: { userId, type, enabled },
  });

  await writeAuditLog({
    userId,
    action: "PERMISSION_CHANGED",
    result: "SUCCESS",
    eventType: type,
  });

  return permission;
}
