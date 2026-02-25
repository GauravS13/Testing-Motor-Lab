import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

/* ═══════════════════════════════════════════════════════
   Iron Session configuration for the Motor Testing Lab.
   Stores user identity in an encrypted HTTP-only cookie.
   ═══════════════════════════════════════════════════════ */

export interface SessionData {
  userId: number;
  userName: string;
  userType: number;
  isLoggedIn: boolean;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET ?? 'motor-lab-secret-key-at-least-32-chars-long!!',
  cookieName: 'motor-lab-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

/**
 * Retrieves (or creates) the current iron-session from cookies.
 * Must be called from a Server Action or Server Component.
 */
export async function getSession() {
  const cookieStore = await cookies();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getIronSession<SessionData>(cookieStore as any, sessionOptions);
}
