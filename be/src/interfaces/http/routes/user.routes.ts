import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { userRepository } from '../../../repositories/user.repository';
import { supabase } from '../../../infrastructure/auth/supabaseAuth';
import { ENV } from '../../../config/env';

export const userRouter = Router();

// GET /api/v1/users/me — Resolve existing onboarded user by ID or Email so returning users skip KYC form!
userRouter.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated' });
      return;
    }

    const emailHint = typeof req.query.email === 'string' ? req.query.email : req.user.email;
    const dbUser = await userRepository.findByIdOrEmail(req.user.id, emailHint, true);

    if (dbUser && dbUser.isOnboarded) {
      const tokenPayload = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.fullName,
        nik: dbUser.nik,
        phone: dbUser.phone,
        role: dbUser.role,
        kycStatus: dbUser.kycStatus,
        isOnboarded: true,
      };
      const sessionToken = `ozik_user_${Buffer.from(JSON.stringify(tokenPayload)).toString('base64')}`;

      res.json({
        success: true,
        token: sessionToken,
        data: {
          id: dbUser.id,
          name: dbUser.fullName,
          fullName: dbUser.fullName,
          email: dbUser.email,
          nik: dbUser.nik,
          phone: dbUser.phone,
          avatarUrl: dbUser.avatarUrl || req.user.avatarUrl || '',
          address: dbUser.address || 'Bandung, Jawa Barat',
          role: dbUser.role,
          kycStatus: dbUser.kycStatus,
          isOnboarded: true,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: req.user.id,
        name: dbUser?.fullName || req.user.name,
        fullName: dbUser?.fullName || req.user.name,
        email: dbUser?.email || req.user.email,
        nik: dbUser?.nik || '',
        phone: dbUser?.phone || req.user.phone || '',
        avatarUrl: dbUser?.avatarUrl || req.user.avatarUrl || '',
        address: dbUser?.address || req.user.address || '',
        role: dbUser?.role || req.user.role || 'VISITOR',
        kycStatus: 'PENDING_SUBMISSION',
        isOnboarded: false,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/users/onboard — Save official KYC & Google profile into PostgreSQL User table
userRouter.post('/onboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      id,
      email,
      fullName,
      name,
      nik,
      phone,
      avatarUrl,
      address,
      role,
    } = req.body;

    const userId = id || req.user?.id;
    const userEmail = email || req.user?.email;
    if (!userId || !userEmail) {
      res.status(400).json({ success: false, error: 'Akun Google diperlukan sebelum mengisi formulir KYC.' });
      return;
    }

    const userFullName = fullName || name || req.user?.name || userEmail.split('@')[0];
    const userNik = nik || '3273011508990001';
    const userPhone = phone || '+62 812-2045-8891';
    const userRole = (role === 'ADMIN' || role === 'GATE_OFFICER' || role === 'VISITOR') ? role : 'VISITOR';

    const saved = await userRepository.upsertUser({
      id: userId,
      email: userEmail,
      fullName: userFullName,
      nik: userNik,
      phone: userPhone,
      avatarUrl: avatarUrl || '',
      address: address || 'Bandung, Jawa Barat',
      role: userRole,
      kycStatus: 'SUBMITTED_TO_ADMIN',
      isOnboarded: true,
    });

    const tokenPayload = {
      id: saved.id,
      email: saved.email,
      name: saved.fullName,
      nik: saved.nik,
      phone: saved.phone,
      role: saved.role,
      kycStatus: saved.kycStatus,
      isOnboarded: true,
    };
    const sessionToken = `ozik_user_${Buffer.from(JSON.stringify(tokenPayload)).toString('base64')}`;

    res.status(200).json({
      success: true,
      message: 'Pengajuan identitas resmi berhasil disimpan ke database utama & dikirim ke Admin Panitia!',
      token: sessionToken,
      data: {
        id: saved.id,
        name: saved.fullName,
        fullName: saved.fullName,
        email: saved.email,
        nik: saved.nik,
        phone: saved.phone,
        avatarUrl: saved.avatarUrl,
        address: saved.address,
        role: saved.role,
        kycStatus: saved.kycStatus,
        isOnboarded: saved.isOnboarded,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/users/switch-role — Switch role (VISITOR, GATE_OFFICER, ADMIN) ON THE EXACT SAME USER ACCOUNT!
userRouter.post('/switch-role', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, userId, email, fullName, nik, phone, avatarUrl, address } = req.body;
    const targetRole: 'VISITOR' | 'ADMIN' | 'GATE_OFFICER' =
      role === 'ADMIN' || role === 'GATE_OFFICER' ? role : 'VISITOR';

    const targetId = userId || req.user?.id;
    if (!targetId) {
      res.status(401).json({ success: false, error: 'Silakan login dengan Google terlebih dahulu.' });
      return;
    }

    const existing = await userRepository.findByIdOrEmail(targetId, email || req.user?.email, false);

    const saved = await userRepository.upsertUser({
      id: targetId,
      email: existing?.email || email || req.user?.email || 'user@gmail.com',
      fullName: existing?.fullName || fullName || req.user?.name || 'Pengguna Terdaftar',
      nik: existing?.nik || nik || req.user?.nik || '3273011508990001',
      phone: existing?.phone || phone || req.user?.phone || '+62 812-0000-0000',
      avatarUrl: existing?.avatarUrl || avatarUrl || req.user?.avatarUrl || '',
      address: existing?.address || address || req.user?.address || 'Bandung, Jawa Barat',
      role: targetRole,
      kycStatus: existing?.kycStatus || req.user?.kycStatus || 'SUBMITTED_TO_ADMIN',
      isOnboarded: true,
    });

    const tokenPayload = {
      id: saved.id,
      email: saved.email,
      name: saved.fullName,
      nik: saved.nik,
      phone: saved.phone,
      role: saved.role,
      kycStatus: saved.kycStatus,
      isOnboarded: true,
    };
    const sessionToken = `ozik_user_${Buffer.from(JSON.stringify(tokenPayload)).toString('base64')}`;

    res.json({
      success: true,
      token: sessionToken,
      data: {
        id: saved.id,
        name: saved.fullName,
        fullName: saved.fullName,
        email: saved.email,
        nik: saved.nik,
        phone: saved.phone,
        avatarUrl: saved.avatarUrl,
        address: saved.address,
        role: saved.role,
        kycStatus: saved.kycStatus,
        isOnboarded: saved.isOnboarded,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/users/reset-playground — Reset ONLY this user's simulation playground back to 0!
userRouter.post('/reset-playground', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = req.body?.userId || req.user?.id;
    if (!targetId) {
      res.status(401).json({ success: false, error: 'Unauthenticated' });
      return;
    }

    await userRepository.resetUserPlayground(targetId);

    res.json({
      success: true,
      message: 'Playground simulasi Anda berhasil di-restart dari 0! Seluruh 60 kursi kembali KOSONG untuk akun Anda.',
    });
  } catch (err) {
    next(err);
  }
});

// Helper handler for permanent total account deletion (PostgreSQL + Memory Cache + Supabase Auth)
const handleDeleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = req.body?.userId || req.user?.id;
    const targetEmail = req.body?.email || req.user?.email;

    if (!targetId && !targetEmail) {
      res.status(401).json({ success: false, error: 'Unauthenticated' });
      return;
    }

    const result = await userRepository.deleteAccountTotally(targetId || '', targetEmail);

    // Also delete from Supabase Auth Admin API if service role key is configured
    if (ENV.SUPABASE_SERVICE_ROLE_KEY && !ENV.SUPABASE_SERVICE_ROLE_KEY.includes('demo')) {
      for (const uid of result.deletedIds) {
        await supabase.auth.admin.deleteUser(uid).catch(() => {});
      }
      if (result.email) {
        try {
          const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
          const matchedAuthUsers = (data?.users || []).filter(
            (u) => u.email && u.email.toLowerCase() === result.email.toLowerCase()
          );
          for (const au of matchedAuthUsers) {
            await supabase.auth.admin.deleteUser(au.id).catch(() => {});
          }
        } catch {
          // Ignore admin listUsers error if service role is publishable/restricted
        }
      }
    }

    res.json({
      success: true,
      message: 'Akun beserta seluruh data identitas resmi, tiket, dan sesi login Anda telah dihapus secara permanen.',
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/users/me & POST /api/v1/users/delete-account
userRouter.delete('/me', authMiddleware, handleDeleteAccount);
userRouter.post('/delete-account', authMiddleware, handleDeleteAccount);
