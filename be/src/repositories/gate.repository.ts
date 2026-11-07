import { prisma } from '../infrastructure/db/prisma';
import { GateLog, ScanResult } from '@prisma/client';

let inMemoryGateLogs: GateLog[] = [];

export class GateRepository {
  public async createLog(data: {
    ticketId?: string | null;
    scannedPayload: string;
    scanResult: ScanResult;
    reason?: string | null;
    gateName?: string;
  }): Promise<GateLog> {
    try {
      return await prisma.gateLog.create({
        data: {
          ticketId: data.ticketId || null,
          scannedPayload: data.scannedPayload,
          scanResult: data.scanResult,
          reason: data.reason || null,
          gateName: data.gateName || 'MAIN_ATRIUM_GATE_1',
        },
      });
    } catch {
      const newLog: GateLog = {
        id: `LOG-${Date.now()}`,
        ticketId: data.ticketId || null,
        scannedPayload: data.scannedPayload,
        scanResult: data.scanResult,
        reason: data.reason || null,
        gateName: data.gateName || 'MAIN_ATRIUM_GATE_1',
        scannedAt: new Date(),
      };
      inMemoryGateLogs.unshift(newLog);
      return newLog;
    }
  }

  public async getRecentLogs(limit: number = 50): Promise<GateLog[]> {
    try {
      return await prisma.gateLog.findMany({
        take: limit,
        orderBy: { scannedAt: 'desc' },
        include: { ticket: true },
      });
    } catch {
      return inMemoryGateLogs.slice(0, limit);
    }
  }
}

export const gateRepository = new GateRepository();
