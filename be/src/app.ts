import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import { seatRouter } from './interfaces/http/routes/seat.routes';
import { checkoutRouter, ticketRouter } from './interfaces/http/routes/checkout.routes';
import { gateRouter } from './interfaces/http/routes/gate.routes';
import { adminRouter } from './interfaces/http/routes/admin.routes';
import { userRouter } from './interfaces/http/routes/user.routes';
import { pricingRouter, adminPricingRouter } from './interfaces/http/controllers/pricing.controller';
import { errorMiddleware } from './interfaces/http/middlewares/error.middleware';
import { KeepAliveService } from './services/keepAlive.service';

export const app = express();

// Middlewares — Explicit CORS + Preflight support for Vercel (https://oziktix.vercel.app) & Localhost
const corsOptions: cors.CorsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Health & Supabase Keep-Alive Ping Endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'oziktix-backend', timestamp: new Date().toISOString() });
});
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'oziktix-backend', timestamp: new Date().toISOString() });
});
app.get('/ping', async (req, res) => {
  try {
    const data = await KeepAliveService.pingDatabase();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err?.message || 'Database ping failed' });
  }
});
app.get('/api/v1/ping', async (req, res) => {
  try {
    const data = await KeepAliveService.pingDatabase();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ status: 'error', error: err?.message || 'Database ping failed' });
  }
});

// Mount Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/seats', seatRouter);
app.use('/api/v1/checkout', checkoutRouter);
app.use('/api/v1/tickets', ticketRouter);
app.use('/api/v1/gate', gateRouter);
app.use('/api/v1/pricing', pricingRouter);
app.use('/api/v1/admin/pricing', adminPricingRouter);
app.use('/api/v1/admin', adminRouter);

// Global Error Middleware
app.use(errorMiddleware);

// Server startup if executed directly
if (require.main === module) {
  const server = app.listen(ENV.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 OzikTix Backend API running on port ${ENV.PORT}`);
    console.log(`🌐 Base URL: http://localhost:${ENV.PORT}/api/v1`);
    console.log(`🔒 Security: HMAC-SHA256 & 30s Dynamic TOTP Engine`);
    console.log(`🏛️ Venue: Summarecon Mall Bandung (Atrium Gala 2026)`);
    console.log(`====================================================`);

    // Auto-start Supabase keep-alive scheduler (every 5 minutes)
    KeepAliveService.startScheduler(5 * 60 * 1000);
  });

  const shutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default app;

