require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Running Per-User Playground & RLS Migration on Supabase PostgreSQL...');

  // 1. Drop global unique index/constraint on Ticket.seatId so each user has an isolated playground
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Ticket" DROP CONSTRAINT IF EXISTS "Ticket_seatId_key";`);
  } catch (e) {
    console.log('Note constraint drop:', e.message);
  }
  try {
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "Ticket_seatId_key";`);
  } catch (e) {
    console.log('Note index drop:', e.message);
  }

  // Create composite index for fast per-user ticket lookups
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Ticket_userId_seatId_idx" ON "Ticket"("userId", "seatId");`);

  // 2. Create UserSeatHold table for isolated per-user holds (visible to that user & Admin)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserSeatHold" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "userEmail" TEXT NOT NULL DEFAULT '',
      "userName" TEXT NOT NULL DEFAULT '',
      "seatId" TEXT NOT NULL,
      "isSimulatedOther" BOOLEAN NOT NULL DEFAULT false,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE ("userId", "seatId")
    );
  `);

  // Enable RLS on UserSeatHold as well
  await prisma.$executeRawUnsafe(`ALTER TABLE "UserSeatHold" ENABLE ROW LEVEL SECURITY;`);
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "service_all_userseathold" ON "UserSeatHold";`);
  await prisma.$executeRawUnsafe(`
    CREATE POLICY "service_all_userseathold" ON "UserSeatHold"
    FOR ALL
    USING (true)
    WITH CHECK (true);
  `);

  // 3. Remove fake preset demo users from User table so only real users remain
  await prisma.$executeRawUnsafe(`
    DELETE FROM "User"
    WHERE "id" IN ('usr_judge_visitor_01', 'usr_admin_panitia_01', 'usr_gate_officer_01')
       OR "email" IN ('rizky.pratama.bdg@gmail.com', 'nadia.wardhani99@gmail.com', 'admin.panitia@summarecon.com', 'gate01@summarecon-security.id');
  `);

  // Backfill User table from any real users who already bought tickets if not yet in User table
  await prisma.$executeRawUnsafe(`
    INSERT INTO "User" ("id", "email", "fullName", "nik", "phone", "avatarUrl", "address", "role", "kycStatus", "isOnboarded", "createdAt", "updatedAt")
    SELECT DISTINCT ON ("userEmail")
      "userId",
      "userEmail",
      "userName",
      '3273011508990001',
      "userPhone",
      '',
      'Bandung, Jawa Barat',
      'VISITOR',
      'SUBMITTED_TO_ADMIN',
      true,
      NOW(),
      NOW()
    FROM "Ticket"
    WHERE "userEmail" NOT IN ('rizky.pratama.bdg@gmail.com', 'nadia.wardhani99@gmail.com', 'admin.panitia@summarecon.com', 'gate01@summarecon-security.id')
    ON CONFLICT DO NOTHING;
  `);

  // Clean fake tickets from preset demo emails
  await prisma.$executeRawUnsafe(`
    DELETE FROM "GateLog" WHERE "ticketId" IN (
      SELECT "id" FROM "Ticket" WHERE "userEmail" IN ('rizky.pratama.bdg@gmail.com', 'nadia.wardhani99@gmail.com', 'admin.panitia@summarecon.com', 'gate01@summarecon-security.id')
    );
  `);
  await prisma.$executeRawUnsafe(`
    DELETE FROM "Ticket"
    WHERE "userEmail" IN ('rizky.pratama.bdg@gmail.com', 'nadia.wardhani99@gmail.com', 'admin.panitia@summarecon.com', 'gate01@summarecon-security.id');
  `);

  // 4. Reset master Seat table status to clean canonical AVAILABLE (actual state is computed per-user or aggregated for Admin)
  await prisma.$executeRawUnsafe(`
    UPDATE "Seat"
    SET "status" = 'AVAILABLE'::"SeatStatus",
        "heldByUserId" = NULL,
        "heldByUserEmail" = NULL,
        "holdExpiresAt" = NULL;
  `);

  const users = await prisma.$queryRawUnsafe(`SELECT "id", "email", "fullName", "role", "kycStatus" FROM "User" ORDER BY "createdAt" DESC;`);
  console.log('Current real users in DB:', users);
  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

