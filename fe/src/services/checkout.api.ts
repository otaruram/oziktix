import { axiosInstance } from './axiosClient';
import { Ticket, User } from '../types';

export const CheckoutApi = {
  /**
   * Finalize order & issue cryptographic passes
   * Calls POST /api/v1/checkout/confirm
   */
  async confirmCheckout(
    seatIds: string[],
    user: User,
    paymentMethod: string = 'qris',
    packageType?: string
  ): Promise<{ success: boolean; tickets?: Ticket[]; quote?: any; error?: string }> {
    try {
      const response = await axiosInstance.post('/api/v1/checkout/confirm', {
        seatId: seatIds[0],
        seatIds,
        paymentMethod,
        packageType,
        attendeePhone: user.phone || '+62 812-3456-7890',
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        maskedNik: user.maskedNik,
      });

      const rawTickets = response.data.tickets || (response.data.ticket ? [response.data.ticket] : response.data.data);
      const tickets: Ticket[] = Array.isArray(rawTickets) ? rawTickets : [rawTickets];

      return {
        success: true,
        quote: response.data.quote,
        tickets: tickets.map((t: any) => ({
          ...t,
          tier: t.tier || t.seat?.tier || 'VIP',
          price: t.price ?? t.seat?.price ?? 250000,
          status: 'ACTIVE' as const,
          purchasedAt: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(),
          eventName: t.eventName || 'Summarecon Mall Bandung Atrium Gala 2026',
          eventDate: t.eventDate || '15 Nov 2026, 19:00 WIB',
          eventVenue: t.eventVenue || 'Main Atrium, Summarecon Mall Bandung (SMB)',
          userMaskedNik: user.maskedNik,
          hmacSignature: t.hmacSignature || t.secretNonce || 'SIG_INITIALIZED',
        })),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Payment confirmation failed',
      };
    }
  },
};
