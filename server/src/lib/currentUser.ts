import { prisma } from "../db";

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL ?? "demo@strand.app";

let cachedUserId: string | null = null;

/**
 * No auth in scope for this assignment — every request acts as the single
 * seeded demo user. Cached after first lookup since the id never changes.
 */
export async function getCurrentUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const user = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL } });
  cachedUserId = user.id;
  return cachedUserId;
}
