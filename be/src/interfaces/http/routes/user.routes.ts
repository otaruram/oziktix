import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { userRepository } from '../../../repositories/user.repository';

export const userRouter = Router();

// GET /api/v1/users/me
userRouter.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated' });
      return;
    }

    const dbUser = await userRepository.findById(req.user.id);
    if (dbUser) {
      res.json({
        success: true,
        data: {
          id: dbUser.id,
          name: dbUser.fullName,
          fullName: dbUser.fullName,
          email: dbUser.email,
          nik: dbUser.nik,
          phone: dbUser.phone,
          avatarUrl: dbUser.avatarUrl,
          address: dbUser.address,
          role: dbUser.role,
          kycStatus: dbUser.kycStatus,
          isOnboarded: dbUser.isOnboarded,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: req.user.id,
        name: req.user.name,
        fullName: req.user.name,
        email: req.user.email,
        nik: req.user.nik || '',
        phone: req.user.phone || '',
        avatarUrl: req.user.avatarUrl || '',
        address: req.user.address || '',
        role: req.user.role || 'VISITOR',
        kycStatus: req.user.kycStatus || 'PENDING_SUBMISSION',
        isOnboarded: Boolean(req.user.isOnboarded),
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

    const existing = await userRepository.findById(targetId);

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
