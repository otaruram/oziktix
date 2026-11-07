import { prisma } from '../infrastructure/db/prisma';
import { SeatStatus, TicketStatus, ScanResult } from '@prisma/client';

interface ShowcaseAttendeeSeed {
  userId: string;
  ticketId: string;
  fullName: string;
  email: string;
  nik: string;
  phone: string;
  avatarUrl: string;
  address: string;
  kycStatus: 'VERIFIED' | 'SUBMITTED_TO_ADMIN';
  seatId: string;
  tier: 'VIP' | 'REGULAR' | 'FESTIVAL';
  price: number;
  ticketStatus: TicketStatus;
  swapCount: number;
  secretNonce: string;
  checkedInMinutesAgo?: number;
  checkedInGate?: string;
}

const SHOWCASE_ATTENDEES: ShowcaseAttendeeSeed[] = [
  {
    userId: 'usr_sim_01',
    ticketId: 'tix_showcase_01',
    fullName: 'Dr. Hendra Wijaya, M.T.',
    email: 'hendra.wijaya@itb-alumni.id',
    nik: '3273011405850002',
    phone: '+62 811-2204-8810',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    address: 'Jl. Ganesa No. 10, Coblong, Kota Bandung',
    kycStatus: 'VERIFIED',
    seatId: 'VIP-A01',
    tier: 'VIP',
    price: 250000,
    ticketStatus: TicketStatus.CHECKED_IN,
    swapCount: 0,
    secretNonce: 'ozik_nonce_vip_a01_9f8e7d6c5b4a',
    checkedInMinutesAgo: 18,
    checkedInGate: 'MAIN_ATRIUM_GATE_1',
  },
  {
    userId: 'usr_sim_02',
    ticketId: 'tix_showcase_02',
    fullName: 'Nadia Kusuma Wardhani',
    email: 'nadia.wardhani@gmail.com',
    nik: '3273025809980004',
    phone: '+62 812-2345-6789',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    address: 'Cluster Flora Summarecon Bandung, Gedebage',
    kycStatus: 'VERIFIED',
    seatId: 'VIP-A02',
    tier: 'VIP',
    price: 250000,
    ticketStatus: TicketStatus.VALID,
    swapCount: 0,
    secretNonce: 'ozik_nonce_vip_a02_1a2b3c4d5e6f',
  },
  {
    userId: 'usr_sim_03',
    ticketId: 'tix_showcase_03',
    fullName: 'Bima Arya Pratama',
    email: 'bima.pratama.bdg@gmail.com',
    nik: '3273052111940001',
    phone: '+62 813-9400-1122',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    address: 'Jl. Ir. H. Juanda (Dago) No. 142, Bandung',
    kycStatus: 'VERIFIED',
    seatId: 'VIP-B04',
    tier: 'VIP',
    price: 250000,
    ticketStatus: TicketStatus.CHECKED_IN,
    swapCount: 1,
    secretNonce: 'ozik_nonce_vip_b04_7c8d9e0f1a2b',
    checkedInMinutesAgo: 12,
    checkedInGate: 'MAIN_ATRIUM_GATE_1',
  },
  {
    userId: 'usr_sim_04',
    ticketId: 'tix_showcase_04',
    fullName: 'Clarissa Putri Maharani',
    email: 'clarissa.maharani@unpar.ac.id',
    nik: '3273076203000003',
    phone: '+62 857-2109-4433',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    address: 'Jl. Ciumbuleuit No. 94, Cidadap, Bandung',
    kycStatus: 'VERIFIED',
    seatId: 'REG-C03',
    tier: 'REGULAR',
    price: 150000,
    ticketStatus: TicketStatus.VALID,
    swapCount: 1,
    secretNonce: 'ozik_nonce_reg_c03_3f4e5d6c7b8a',
  },
  {
    userId: 'usr_sim_05',
    ticketId: 'tix_showcase_05',
    fullName: 'Fajar Siddiq Permana',
    email: 'fajar.permana@summarecon-partner.id',
    nik: '3273091007920005',
    phone: '+62 812-8877-6655',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    address: 'Jl. Bulevar Utama Summarecon Bandung No. 18',
    kycStatus: 'VERIFIED',
    seatId: 'REG-C04',
    tier: 'REGULAR',
    price: 150000,
    ticketStatus: TicketStatus.CHECKED_IN,
    swapCount: 0,
    secretNonce: 'ozik_nonce_reg_c04_5a6b7c8d9e0f',
    checkedInMinutesAgo: 9,
    checkedInGate: 'VIP_EAST_GATE_2',
  },
  {
    userId: 'usr_sim_06',
    ticketId: 'tix_showcase_06',
    fullName: 'Dewi Lestari Anggraini',
    email: 'dewi.anggraini.bdg@gmail.com',
    nik: '3273114501990008',
    phone: '+62 821-1990-3344',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    address: 'Jl. Buah Batu No. 210, Lengkong, Bandung',
    kycStatus: 'SUBMITTED_TO_ADMIN',
    seatId: 'REG-D05',
    tier: 'REGULAR',
    price: 150000,
    ticketStatus: TicketStatus.VALID,
    swapCount: 0,
    secretNonce: 'ozik_nonce_reg_d05_8b9c0d1e2f3a',
  },
  {
    userId: 'usr_sim_07',
    ticketId: 'tix_showcase_07',
    fullName: 'Rangga Aditya Saputra',
    email: 'rangga.saputra@gmail.com',
    nik: '3273141908970006',
    phone: '+62 819-3120-7788',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    address: 'Jl. Setiabudi No. 88, Sukasari, Bandung',
    kycStatus: 'SUBMITTED_TO_ADMIN',
    seatId: 'FEST-E02',
    tier: 'FESTIVAL',
    price: 100000,
    ticketStatus: TicketStatus.VALID,
    swapCount: 0,
    secretNonce: 'ozik_nonce_fest_e02_2c3d4e5f6a7b',
  },
  {
    userId: 'usr_sim_08',
    ticketId: 'tix_showcase_08',
    fullName: 'Salsabila Nurul Huda',
    email: 'salsabila.huda@gmail.com',
    nik: '3273165212010009',
    phone: '+62 852-9080-1122',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    address: 'Jl. Soekarno-Hatta No. 590, Gedebage, Bandung',
    kycStatus: 'SUBMITTED_TO_ADMIN',
    seatId: 'FEST-F06',
    tier: 'FESTIVAL',
    price: 100000,
    ticketStatus: TicketStatus.CHECKED_IN,
    swapCount: 0,
    secretNonce: 'ozik_nonce_fest_f06_6d7e8f9a0b1c',
    checkedInMinutesAgo: 5,
    checkedInGate: 'MAIN_ATRIUM_GATE_1',
  },
];

export class ShowcaseSeederService {
  private static lastCheckAt = 0;
  private static isRunning = false;

  /**
   * Guarantees that the Admin Dashboard, Occupancy Charts, Red SOLD Seats, Active 5m Holds,
   * Swap Logs, and Gate Scanner Registry are always populated with realistic live simulation data.
   */
  public static async ensureSeeded(force: boolean = false): Promise<void> {
    const nowMs = Date.now();
    if (!force && (this.isRunning || nowMs - this.lastCheckAt < 45000)) {
      return;
    }

    this.isRunning = true;
    this.lastCheckAt = nowMs;

    try {
      // 1. Ensure UserSeatHold table exists
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "UserSeatHold" (
          "id" TEXT PRIMARY KEY,
          "seatId" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "userEmail" TEXT NOT NULL,
          "userName" TEXT NOT NULL,
          "isSimulatedOther" BOOLEAN NOT NULL DEFAULT false,
          "expiresAt" TIMESTAMPTZ NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `.catch(() => {});

      // 2. Ensure all 60 physical seats exist in Seat table
      const seatCount = await prisma.seat.count().catch(() => 60);
      if (seatCount < 60) {
        const rows = [
          { row: 'A', tier: 'VIP', price: 250000, prefix: 'VIP' },
          { row: 'B', tier: 'VIP', price: 250000, prefix: 'VIP' },
          { row: 'C', tier: 'REGULAR', price: 150000, prefix: 'REG' },
          { row: 'D', tier: 'REGULAR', price: 150000, prefix: 'REG' },
          { row: 'E', tier: 'FESTIVAL', price: 100000, prefix: 'FEST' },
          { row: 'F', tier: 'FESTIVAL', price: 100000, prefix: 'FEST' },
        ];
        for (const r of rows) {
          for (let col = 1; col <= 10; col++) {
            const id = `${r.prefix}-${r.row}${col.toString().padStart(2, '0')}`;
            await prisma.seat
              .upsert({
                where: { id },
                update: {},
                create: {
                  id,
                  rowLabel: r.row,
                  seatNumber: col,
                  tier: r.tier,
                  price: r.price,
                  status: SeatStatus.AVAILABLE,
                },
              })
              .catch(() => {});
          }
        }
      }

      // 3. Check how many showcase tickets exist
      const existingShowcaseCount = await prisma.ticket.count({
        where: { id: { startsWith: 'tix_showcase_' } },
      });

      if (existingShowcaseCount < 6 || force) {
        for (const item of SHOWCASE_ATTENDEES) {
          // Upsert Showcase User in public."User"
          await prisma.$executeRaw`
            INSERT INTO "User" (
              "id", "email", "fullName", "nik", "phone", "avatarUrl", "address", "role", "kycStatus", "isOnboarded", "createdAt", "updatedAt"
            )
            VALUES (
              ${item.userId},
              ${item.email},
              ${item.fullName},
              ${item.nik},
              ${item.phone},
              ${item.avatarUrl},
              ${item.address},
              'VISITOR',
              ${item.kycStatus},
              true,
              NOW() - INTERVAL '35 minutes',
              NOW()
            )
            ON CONFLICT ("id") DO UPDATE SET
              "fullName" = EXCLUDED."fullName",
              "nik" = EXCLUDED."nik",
              "phone" = EXCLUDED."phone",
              "avatarUrl" = EXCLUDED."avatarUrl",
              "address" = EXCLUDED."address",
              "isOnboarded" = true;
          `.catch(() => {});

          const checkedInAt = item.checkedInMinutesAgo
            ? new Date(Date.now() - item.checkedInMinutesAgo * 60 * 1000)
            : null;

          // Upsert Showcase Ticket if seat is free or already belongs to this showcase ticket
          const conflictingTicket = await prisma.ticket.findUnique({
            where: { seatId: item.seatId },
          });

          if (!conflictingTicket || conflictingTicket.id === item.ticketId) {
            await prisma.ticket
              .upsert({
                where: { id: item.ticketId },
                update: {
                  status: force ? item.ticketStatus : conflictingTicket?.status || item.ticketStatus,
                },
                create: {
                  id: item.ticketId,
                  seatId: item.seatId,
                  userId: item.userId,
                  userEmail: item.email,
                  userName: item.fullName,
                  userPhone: item.phone,
                  status: item.ticketStatus,
                  swapCount: item.swapCount,
                  secretNonce: item.secretNonce,
                  checkedInAt,
                  checkedInGate: item.checkedInGate || null,
                },
              })
              .catch(() => {});

            await prisma.seat
              .update({
                where: { id: item.seatId },
                data: {
                  status: SeatStatus.SOLD,
                  heldByUserId: item.userId,
                  heldByUserEmail: item.email,
                  holdExpiresAt: null,
                },
              })
              .catch(() => {});
          }
        }

        // Seed 2 realistic SwapLog rows if empty
        const swapCount = await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int AS cnt FROM "SwapLog";`.catch(() => [{ cnt: 1 }]);
        if ((swapCount[0]?.cnt || 0) < 2) {
          await prisma.$executeRaw`
            INSERT INTO "SwapLog" ("id", "ticketId", "userId", "userName", "fromSeatId", "toSeatId", "tier", "reason", "createdAt")
            VALUES
              ('swap_showcase_01', 'tix_showcase_04', 'usr_sim_04', 'Clarissa Putri Maharani', 'REG-C01', 'REG-C03', 'REGULAR', 'Relokasi Mandiri 1x Gratis (Sudut Pandang Tengah Atrium)', NOW() - INTERVAL '22 minutes'),
              ('swap_showcase_02', 'tix_showcase_03', 'usr_sim_03', 'Bima Arya Pratama', 'VIP-A05', 'VIP-B04', 'VIP', 'Relokasi Mandiri 1x Gratis (Rotasi Nonce HMAC Baru)', NOW() - INTERVAL '16 minutes')
            ON CONFLICT ("id") DO NOTHING;
          `.catch(() => {});
        }

        // Seed 4 realistic GateLog rows if empty
        const gateLogCount = await prisma.gateLog.count().catch(() => 4);
        if (gateLogCount < 3) {
          const sampleGateLogs = [
            {
              id: 'glog_showcase_01',
              ticketId: 'tix_showcase_01',
              scannedPayload: JSON.stringify({ app: 'OZIKTIX', tid: 'tix_showcase_01', seat: 'VIP-A01', verdict: 'VALID' }),
              scanResult: ScanResult.VALID,
              reason: 'Identitas & TTD Digital HMAC-SHA256 Terverifikasi (Dr. Hendra Wijaya, M.T. - VIP-A01)',
              gateName: 'MAIN_ATRIUM_GATE_1',
              scannedAt: new Date(Date.now() - 18 * 60 * 1000),
            },
            {
              id: 'glog_showcase_02',
              ticketId: 'tix_showcase_03',
              scannedPayload: JSON.stringify({ app: 'OZIKTIX', tid: 'tix_showcase_03', seat: 'VIP-B04', verdict: 'VALID' }),
              scanResult: ScanResult.VALID,
              reason: 'Identitas & TTD Digital HMAC-SHA256 Terverifikasi (Bima Arya Pratama - VIP-B04)',
              gateName: 'MAIN_ATRIUM_GATE_1',
              scannedAt: new Date(Date.now() - 12 * 60 * 1000),
            },
            {
              id: 'glog_showcase_03',
              ticketId: 'tix_showcase_01',
              scannedPayload: JSON.stringify({ app: 'OZIKTIX', tid: 'tix_showcase_01', seat: 'VIP-A01', replay: true }),
              scanResult: ScanResult.ALREADY_USED,
              reason: 'Anti-Passback Alert: Tiket VIP-A01 sudah digunakan masuk sebelumnya pada Gate 1',
              gateName: 'MAIN_ATRIUM_GATE_1',
              scannedAt: new Date(Date.now() - 8 * 60 * 1000),
            },
            {
              id: 'glog_showcase_04',
              ticketId: 'tix_showcase_02',
              scannedPayload: JSON.stringify({ app: 'OZIKTIX', tid: 'tix_showcase_02', sig: 'expired_totp_screenshot' }),
              scanResult: ScanResult.INVALID,
              reason: 'Tanda Tangan Digital / Token TOTP 30 detik kedaluwarsa (Percobaan Screenshot Statis Ditolak)',
              gateName: 'VIP_EAST_GATE_2',
              scannedAt: new Date(Date.now() - 4 * 60 * 1000),
            },
          ];

          for (const g of sampleGateLogs) {
            await prisma.gateLog
              .upsert({
                where: { id: g.id },
                update: {},
                create: g,
              })
              .catch(() => {});
          }
        }
      }

      // 4. Always keep 2 simulated active 5-minute holds fresh for the Admin Console telemetry
      await prisma.$executeRaw`
        INSERT INTO "UserSeatHold" ("id", "seatId", "userId", "userEmail", "userName", "isSimulatedOther", "expiresAt", "createdAt")
        VALUES
          ('hold_showcase_01', 'VIP-B08', 'usr_sim_hold_01', 'kevin.sanjaya.bdg@gmail.com', 'Kevin Sanjaya (Checkout Hold)', false, NOW() + INTERVAL '4 minutes 25 seconds', NOW()),
          ('hold_showcase_02', 'REG-D09', 'usr_sim_hold_02', 'aulia.rahman@itb.ac.id', 'Aulia Rahman (Checkout Hold)', false, NOW() + INTERVAL '3 minutes 40 seconds', NOW())
        ON CONFLICT ("id") DO UPDATE SET
          "expiresAt" = CASE
            WHEN "UserSeatHold"."expiresAt" < NOW() + INTERVAL '60 seconds'
            THEN NOW() + INTERVAL '4 minutes 30 seconds'
            ELSE "UserSeatHold"."expiresAt"
          END;
      `.catch(() => {});
    } catch (err) {
      console.warn('[ShowcaseSeeder] Non-fatal seed warning:', err);
    } finally {
      this.isRunning = false;
    }
  }
}

