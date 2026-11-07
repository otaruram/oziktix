import { PrismaClient, SeatStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedVenueSeats() {
  console.log('Seeding 60 Physical Seats for Summarecon Mall Bandung Main Atrium...');

  const rows = [
    { row: 'A', tier: 'VIP', price: 250000, prefix: 'VIP' },
    { row: 'B', tier: 'VIP', price: 250000, prefix: 'VIP' },
    { row: 'C', tier: 'REGULAR', price: 150000, prefix: 'REG' },
    { row: 'D', tier: 'REGULAR', price: 150000, prefix: 'REG' },
    { row: 'E', tier: 'REGULAR', price: 150000, prefix: 'REG' },
    { row: 'F', tier: 'FESTIVAL', price: 100000, prefix: 'FEST' },
  ];

  const seatsToUpsert = [];

  for (const r of rows) {
    for (let col = 1; col <= 10; col++) {
      const paddedCol = col.toString().padStart(2, '0');
      const seatId = `${r.prefix}-${r.row}${paddedCol}`;

      seatsToUpsert.push({
        id: seatId,
        rowLabel: r.row,
        seatNumber: col,
        tier: r.tier,
        price: r.price,
        status: SeatStatus.AVAILABLE,
        heldByUserId: null,
        heldByUserEmail: null,
        holdExpiresAt: null,
      });
    }
  }

  const result = await prisma.seat.createMany({
    data: seatsToUpsert,
    skipDuplicates: true,
  });

  // Also clear any stuck RESERVED locks so the venue grid is clean and ready
  await prisma.seat.updateMany({
    where: { status: SeatStatus.RESERVED },
    data: {
      status: SeatStatus.AVAILABLE,
      heldByUserId: null,
      heldByUserEmail: null,
      holdExpiresAt: null,
    },
  });

  console.log(`Successfully seeded ${result.count} physical seats and cleared stale locks in PostgreSQL.`);
}

async function main() {
  try {
    await seedVenueSeats();
  } catch (e) {
    console.error('Seeding error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

