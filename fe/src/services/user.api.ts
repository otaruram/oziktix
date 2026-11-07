import { axiosInstance } from './axiosClient';
import { User, UserRole } from '../types';

export const UserApi = {
  async getMe(): Promise<User | null> {
    try {
      const response = await axiosInstance.get('/api/v1/users/me');
      const d = response.data?.data || response.data;
      if (!d || !d.id) return null;
      return {
        id: d.id,
        name: d.fullName || d.name || 'Pengguna Google',
        email: d.email,
        avatarUrl: d.avatarUrl || '',
        nik: d.nik || '',
        maskedNik: d.nik || '3273011508990001',
        phone: d.phone || '+62 812-2045-8891',
        address: d.address || 'Bandung, Jawa Barat',
        role: (d.role as UserRole) || 'VISITOR',
        kycStatus: d.kycStatus || 'SUBMITTED_TO_ADMIN',
        isOnboarded: Boolean(d.isOnboarded),
        isGoogleVerified: true,
      };
    } catch {
      return null;
    }
  },

  async onboardUser(params: {
    id?: string;
    email: string;
    fullName: string;
    nik: string;
    phone: string;
    avatarUrl?: string;
    address?: string;
    role: UserRole;
  }): Promise<{ success: boolean; user?: User; token?: string; message?: string; error?: string }> {
    try {
      const response = await axiosInstance.post('/api/v1/users/onboard', params);
      const d = response.data?.data || response.data;
      const token = response.data?.token;
      if (token) {
        localStorage.setItem('oziktix_auth_token', token);
      }
      const user: User = {
        id: d.id,
        name: d.fullName || d.name || params.fullName,
        email: d.email || params.email,
        avatarUrl: d.avatarUrl || params.avatarUrl || '',
        nik: d.nik || params.nik,
        maskedNik: d.nik || params.nik,
        phone: d.phone || params.phone,
        address: d.address || params.address || 'Bandung, Jawa Barat',
        role: (d.role as UserRole) || params.role,
        kycStatus: d.kycStatus || 'SUBMITTED_TO_ADMIN',
        isOnboarded: true,
        isGoogleVerified: true,
        accessToken: token,
      };
      return {
        success: true,
        user,
        token,
        message: response.data?.message || 'Pengajuan telah dikirim ke Admin Panitia!',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.response?.data?.message || err.message || 'Gagal mengirim pengajuan identitas',
      };
    }
  },

  /**
   * Switch Role (VISITOR, GATE_OFFICER, ADMIN) strictly keeping the SAME user's real registered account!
   */
  async switchRole(
    role: UserRole,
    currentUser: User
  ): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    try {
      const response = await axiosInstance.post('/api/v1/users/switch-role', {
        role,
        userId: currentUser.id,
        email: currentUser.email,
        fullName: currentUser.name,
        nik: currentUser.nik || currentUser.maskedNik,
        phone: currentUser.phone,
        avatarUrl: currentUser.avatarUrl,
        address: currentUser.address,
      });
      const d = response.data?.data || response.data;
      const token = response.data?.token;
      if (token) {
        localStorage.setItem('oziktix_auth_token', token);
      }
      const user: User = {
        id: d.id || currentUser.id,
        name: d.fullName || d.name || currentUser.name,
        email: d.email || currentUser.email,
        avatarUrl: d.avatarUrl || currentUser.avatarUrl || '',
        nik: d.nik || currentUser.nik || '3273011508990001',
        maskedNik: d.nik || currentUser.maskedNik || '3273011508990001',
        phone: d.phone || currentUser.phone || '+62 812-2045-8891',
        address: d.address || currentUser.address || 'Bandung, Jawa Barat',
        role: (d.role as UserRole) || role,
        kycStatus: d.kycStatus || currentUser.kycStatus || 'SUBMITTED_TO_ADMIN',
        isOnboarded: true,
        isGoogleVerified: true,
        accessToken: token,
      };
      return { success: true, user, token };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Gagal mengganti role',
      };
    }
  },

  /**
   * Reset ONLY this user's simulation playground back to 0 (all 60 seats become AVAILABLE for this user)
   */
  async resetPlayground(userId?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await axiosInstance.post('/api/v1/users/reset-playground', { userId });
      return {
        success: true,
        message: response.data?.message || 'Playground simulasi Anda berhasil di-restart dari 0!',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Gagal mereset playground simulasi',
      };
    }
  },
};
