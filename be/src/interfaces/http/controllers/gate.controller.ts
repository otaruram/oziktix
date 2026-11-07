import { Request, Response, NextFunction } from 'express';
import { gateService } from '../../../services/gate.service';
import { BadRequestError } from '../../../domain/errors';

export class GateController {
  public async searchTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const results = await gateService.searchUniversalTickets(q);
      res.status(200).json({
        success: true,
        data: results,
        tickets: results,
      });
    } catch (e) {
      next(e);
    }
  }

  public async scan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        ticketId,
        timeWindow,
        signature,
        rawPayload,
        payload,
        directIdentityVerify,
        simulateScenario,
        gateName,
      } = req.body;

      let parsedTicketId = ticketId;
      let parsedTimeWindow = timeWindow;
      let parsedSignature = signature;
      const rawString = rawPayload || payload || '';

      if (!parsedTicketId && rawString) {
        try {
          const parsed = JSON.parse(rawString);
          parsedTicketId = parsed.tid || parsed.ticketId;
          parsedTimeWindow = parsed.tw || parsed.timeWindow || Math.floor(Date.now() / 30000);
          parsedSignature = parsed.sig || parsed.signature || parsed.totp || '';
        } catch {
          // Keep as is
        }
      }

      if (!parsedTicketId) {
        throw new BadRequestError('ticketId or formatted rawPayload is required for gate scan.');
      }

      const result = await gateService.verifyScan(
        {
          ticketId: parsedTicketId,
          timeWindow: Number(parsedTimeWindow) || Math.floor(Date.now() / 30000),
          signature: parsedSignature || '',
          rawPayload: rawString,
          bypassCryptoForDirectIdentityScan: Boolean(directIdentityVerify),
          simulateScenario,
        },
        gateName || 'MAIN_ATRIUM_GATE_1'
      );

      res.status(200).json({
        success: result.verdict === 'VALID',
        data: result,
        ...result,
      });
    } catch (e) {
      next(e);
    }
  }
}

export const gateController = new GateController();
