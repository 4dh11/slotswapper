import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const userA = await prisma.user.upsert({
    where: { email: "alice@demo.com" },
    update: {},
    create: {
      name: "Alice",
      email: "alice@demo.com",
      password: await bcrypt.hash("password123", 10),
    },
  });

  const userB = await prisma.user.upsert({
    where: { email: "bob@demo.com" },
    update: {},
    create: {
      name: "Bob",
      email: "bob@demo.com",
      password: await bcrypt.hash("password123", 10),
    },
  });

  await prisma.event.createMany({
    data: [
      {
        title: "Team Meeting",
        startTime: new Date("2025-11-05T10:00:00"),
        endTime: new Date("2025-11-05T11:00:00"),
        status: "BUSY",
        userId: userA.id,
      },
      {
        title: "Focus Block",
        startTime: new Date("2025-11-05T14:00:00"),
        endTime: new Date("2025-11-05T15:00:00"),
        status: "BUSY",
        userId: userB.id,
      },
    ],
  });

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
