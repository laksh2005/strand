import "dotenv/config";
import { EventType } from "@prisma/client";
import { beforeEach } from "vitest";
import { prisma } from "../src/db";

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? "demo@strand.app";

export async function getTestUserId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL },
  });
  return user.id;
}

beforeEach(async () => {
  const userId = await getTestUserId();

  await prisma.auditLog.deleteMany({ where: { userId } });
  await prisma.event.deleteMany({ where: { userId } });

  for (const type of Object.values(EventType)) {
    await prisma.permission.upsert({
      where: { userId_type: { userId, type } },
      update: { enabled: true },
      create: { userId, type, enabled: true },
    });
  }
});
