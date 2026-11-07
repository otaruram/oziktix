import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function enableRlsOnAllTables() {
  const tables = ['User', 'Seat', 'Ticket', 'SwapLog', 'GateLog'];

  for (const table of tables) {
    console.log(`Enabling Row Level Security (RLS) on public."${table}"...`);
    await prisma.$executeRawUnsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);

    const policyName = `allow_all_authenticated_and_service_${table.toLowerCase()}`;
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${policyName}" ON public."${table}";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "${policyName}"
      ON public."${table}"
      FOR ALL
      TO postgres, anon, authenticated, service_role
      USING (true)
      WITH CHECK (true);
    `);
    console.log(`✓ RLS Enabled & Policy active on public."${table}"`);
  }

  // Verify RLS status in pg_tables
  const status: any[] = await prisma.$queryRaw`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('User', 'Seat', 'Ticket', 'SwapLog', 'GateLog')
    ORDER BY tablename;
  `;
  console.table(status);
}

enableRlsOnAllTables()
  .catch((e) => {
    console.error('Error enabling RLS:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

