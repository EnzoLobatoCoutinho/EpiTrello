/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** auth utilities for handling both NextAuth and custom JWT
*/

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

/**
 * Get the current user from either NextAuth session (Google OAuth) or custom JWT token (credentials)
 * Returns { userId: number; email: string } or null if not authenticated
 */
export async function getCurrentUser(): Promise<{ userId: number; email: string } | null> {
  // Try NextAuth session first (Google OAuth)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    const userId = typeof session.user.id === 'string' ? parseInt(session.user.id, 10) : session.user.id;
    if (session.user.email && userId) {
      console.log("[AUTH] getCurrentUser - NextAuth session found for:", session.user.email, "ID:", userId);
      return { userId, email: session.user.email };
    }
  }

  // Fallback to custom JWT token (credentials login)
  const token = (await cookies()).get("token")?.value;
  if (!token) {
    console.log("[AUTH] getCurrentUser - No authentication method found");
    return null;
  }

  try {
    const decoded = jwt.decode(token) as { id?: number; userId?: number; email: string };
    const userId = decoded.id ?? decoded.userId;
    if (!userId) return null;
    console.log("[AUTH] getCurrentUser - JWT token found for:", decoded.email, "ID:", userId);
    return { userId, email: decoded.email };
  } catch (error) {
    console.log("[AUTH] getCurrentUser - JWT decode failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get user ID from request for API routes
 * Checks Authorization header, custom JWT cookie, and NextAuth session
 * Validates that user exists in database
 */
export async function getUserIdFromRequest(req: Request): Promise<number | null> {
  // Check Authorization header first
  const auth = req.headers.get("authorization") || "";
  let token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "dev_secret";
      const payload: any = jwt.verify(token, secret);
      let userId = payload?.id ?? payload?.userId;
      
      if (userId) {
        userId = Number(userId);
        // Validate user exists in database
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true },
        });
        
        if (user) {
          console.log("[AUTH] User authenticated via Bearer token, ID:", userId, "email:", user.email);
          return userId;
        } else {
          console.log("[AUTH] Bearer token has invalid user ID:", userId, "- user not found in database");
          // Fall through to other methods
        }
      }
    } catch (error) {
      console.log("[AUTH] Bearer token verification failed:", error instanceof Error ? error.message : error);
    }
  }

  // Check custom JWT cookie
  const cookieStore = await cookies();
  token = cookieStore.get("token")?.value || null;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "dev_secret";
      const payload: any = jwt.verify(token, secret);
      let userId = payload?.id ?? payload?.userId;
      
      if (userId) {
        userId = Number(userId);
        // Validate user exists in database
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true },
        });
        
        if (user) {
          console.log("[AUTH] User authenticated via JWT cookie, ID:", userId, "email:", user.email);
          return userId;
        } else {
          console.log("[AUTH] JWT cookie has invalid user ID:", userId, "- user not found in database");
          // Fall through to NextAuth
        }
      }
    } catch (error) {
      console.log("[AUTH] JWT cookie verification failed:", error instanceof Error ? error.message : error);
    }
  }

  // Try NextAuth session as fallback
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      let userId = typeof session.user.id === 'string' ? parseInt(session.user.id, 10) : session.user.id;
      
      // If session has no valid ID, try to find user by email
      if (!userId && session.user.email) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        if (user) {
          userId = user.id;
        }
      }
      
      if (userId && session.user.email) {
        console.log("[AUTH] User authenticated via NextAuth session:", session.user.email, "ID:", userId);
        return userId;
      }
    }
  } catch (error) {
    console.log("[AUTH] NextAuth session check failed:", error instanceof Error ? error.message : error);
  }

  console.log("[AUTH] getUserIdFromRequest - No valid authentication method found");
  return null;
}
