import { useState, useEffect, useCallback } from 'react';
import { supabase, signInWithGoogle, signOut } from '../config/supabase';
import { User, UserRole } from '../types';
import { ENV } from '../config/env';

export const DEMO_PROFILES: Record<UserRole, User> = {
  VISITOR: {
    id: 'usr_judge_visitor_01',
    name: 'Budi Hartono (Judge / Attendee)',
    email: 'budi.hartono@summarecon-gala.id',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    maskedNik: '3273041511980002',
    phone: '+62 812-9843-1102',
    role: 'VISITOR',
    isGoogleVerified: true,
    accessToken: ENV.DEMO_JWT_TOKEN,
  },
  GATE_OFFICER: {
    id: 'usr_gate_officer_01',
    name: 'Ahmad Fauzi (Gate Inspector 01)',
    email: 'gate01@summarecon-security.id',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    maskedNik: '3273091206920005',
    phone: '+62 856-7788-9900',
    role: 'GATE_OFFICER',
    isGoogleVerified: true,
    accessToken: 'demo_jwt_gate_officer_token',
  },
  ADMIN: {
    id: 'usr_admin_panitia_01',
    name: 'Siti Rahmawati (Lead Panitia)',
    email: 'admin.panitia@summarecon.com',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces',
    maskedNik: '3273082103900001',
    phone: '+62 811-2233-4455',
    role: 'ADMIN',
    isGoogleVerified: true,
    accessToken: 'demo_jwt_admin_panitia_token',
  },
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(DEMO_PROFILES.VISITOR);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // 1. Listen for Supabase Google OAuth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const token = session.access_token;
          localStorage.setItem('oziktix_auth_token', token);

          const googleUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Google User',
            email: session.user.email || '',
            avatarUrl: session.user.user_metadata?.avatar_url,
            maskedNik: '3273041511980002', // Seeded verification NIK
            phone: session.user.phone || '+62 812-3456-7890',
            role: 'VISITOR',
            isGoogleVerified: true,
            accessToken: token,
          };
          setUser(googleUser);
        }
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Google User',
          email: session.user.email || '',
          avatarUrl: session.user.user_metadata?.avatar_url,
          maskedNik: '3273041511980002',
          phone: session.user.phone || '+62 812-3456-7890',
          role: 'VISITOR',
          isGoogleVerified: true,
          accessToken: session.access_token,
        });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  /**
   * Judge 1-Click Login (Demo Account)
   * Injects pre-configured demo JWT token so judges can test without a Google account
   */
  const loginAsDemoJudge = useCallback((role: UserRole = 'VISITOR') => {
    const profile = DEMO_PROFILES[role];
    localStorage.setItem('oziktix_auth_token', profile.accessToken || ENV.DEMO_JWT_TOKEN);
    setUser(profile);
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      // Fallback
      loginAsDemoJudge('VISITOR');
    } finally {
      setLoading(false);
    }
  }, [loginAsDemoJudge]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
    } catch {
      // Ignore
    }
    localStorage.removeItem('oziktix_auth_token');
    setUser(null);
  }, []);

  return {
    user,
    setUser,
    loading,
    loginAsDemoJudge,
    loginWithGoogle: handleGoogleLogin,
    logout: handleLogout,
  };
};

