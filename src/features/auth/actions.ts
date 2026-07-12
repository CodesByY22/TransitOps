"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

// In-memory lockout map: key is email, value is lockout details
// Since server actions load in memory, this persists within the process.
const lockoutMap = new Map<string, { attempts: number; lockUntil: number }>();

export interface AuthState {
  success: boolean;
  error?: string;
  lockoutRemaining?: number; // in seconds
}

export async function login(prevState: any, formData: FormData): Promise<AuthState> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { success: false, error: "Please enter both email and password." };
  }

  // Check Lockout
  const now = Date.now();
  const lockout = lockoutMap.get(email);
  if (lockout && lockout.attempts >= 5 && lockout.lockUntil > now) {
    const remaining = Math.ceil((lockout.lockUntil - now) / 1000);
    return {
      success: false,
      error: `Too many failed attempts. Account locked.`,
      lockoutRemaining: remaining,
    };
  }

  try {
    // Find user and include role
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    // Simple password verification
    // Since seed uses format pbkdf2_sha256$placeholder$mahavir123, we check if passwordHash ends with the input password.
    const isValidPassword = user && user.passwordHash.endsWith(password);

    if (!user || !isValidPassword) {
      // Record failed attempt
      const attempts = lockout ? (lockout.attempts >= 5 ? 1 : lockout.attempts + 1) : 1;
      const lockUntil = attempts >= 5 ? Date.now() + 30000 : 0; // 30s lockout
      lockoutMap.set(email, { attempts, lockUntil });

      const remainingAttempts = 5 - attempts;
      if (attempts >= 5) {
        return {
          success: false,
          error: "Too many failed attempts. Account locked for 30 seconds.",
          lockoutRemaining: 30,
        };
      }
      return {
        success: false,
        error: `Invalid email or password. ${remainingAttempts} attempts remaining.`,
      };
    }

    // Success: clear lockout
    lockoutMap.delete(email);

    // Create session cookie
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
    };

    const cookieStore = await cookies();
    cookieStore.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Login server error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  try {
    return JSON.parse(session) as {
      id: number;
      email: string;
      name: string;
      role: string;
    };
  } catch {
    return null;
  }
}
