import { PrismaClient, EventType } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@strand.app";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL },
  });

  const types = Object.values(EventType);
  for (const type of types) {
    await prisma.permission.upsert({
      where: { userId_type: { userId: user.id, type } },
      update: {},
      create: { userId: user.id, type, enabled: true },
    });
  }

  const existing = await prisma.event.count({ where: { userId: user.id } });
  if (existing === 0) {
    const now = Date.now();
    await prisma.event.createMany({
      data: [
        {
          userId: user.id,
          type: "conversation",
          title: "Call with Sam",
          content: "Discussed weekend plans.",
          timestamp: new Date(now - 1000 * 60 * 60 * 5),
        },
        {
          userId: user.id,
          type: "location",
          title: "Visited Coffee House",
          content: "12 Market St.",
          timestamp: new Date(now - 1000 * 60 * 60 * 4),
        },
        {
          userId: user.id,
          type: "physiological",
          title: "Heart rate reading",
          content: "72 bpm, resting.",
          timestamp: new Date(now - 1000 * 60 * 60 * 3),
        },
        {
          userId: user.id,
          type: "note",
          title: "Idea",
          content: "Try the new timeline layout.",
          timestamp: new Date(now - 1000 * 60 * 60 * 2),
        },
        {
          userId: user.id,
          type: "location",
          title: "Arrived home",
          content: "45 Elm St.",
          timestamp: new Date(now - 1000 * 60 * 60),
        },
      ],
    });
  }

  console.log(`Seeded demo user ${user.id} (${user.email})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
