'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/* ═══════════════════════════════════════════════════════
   Server Actions — User authentication (iron-session)
   ═══════════════════════════════════════════════════════ */

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: {
    userId: number;
    userName: string;
    email: string | null;
    userType: number;
  };
}

/**
 * Authenticates a user by comparing plain-text credentials
 * against the Users table. On success, creates an iron-session cookie.
 */
export async function loginUser(
  username: string,
  password: string,
): Promise<LoginResult> {
  try {
    const user = await prisma.user.findFirst({
      where: { userName: username },
    });

    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    if (user.isDeleted) {
      return { success: false, error: 'This account has been deactivated' };
    }

    if (user.password !== password) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Save session cookie
    const session = await getSession();
    session.userId = user.userId;
    session.userName = user.userName;
    session.userType = user.userType;
    session.isLoggedIn = true;
    await session.save();

    return {
      success: true,
      user: {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        userType: user.userType,
      },
    };
  } catch (error) {
    console.error('[loginUser] Error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Destroys the current session cookie, logging the user out.
 */
export async function logoutUser(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

/**
 * Returns the currently authenticated user from the session cookie.
 * Returns `null` if not logged in.
 */
export async function getSessionUser(): Promise<LoginResult['user'] | null> {
  try {
    const session = await getSession();

    if (!session.isLoggedIn) return null;

    return {
      userId: session.userId,
      userName: session.userName,
      email: null, // Not stored in session
      userType: session.userType,
    };
  } catch {
    return null;
  }
}
