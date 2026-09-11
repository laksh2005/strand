import { AuditAction, AuditResult, EventType } from "@prisma/client";
import { prisma } from "../db";

export function writeAuditLog(params: {
  userId: string;
  action: AuditAction;
  result: AuditResult;
  eventType?: EventType;
}) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      result: params.result,
      eventType: params.eventType,
    },
  });
}
