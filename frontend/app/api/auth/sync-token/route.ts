/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** Sync authentication token - ensures client has valid JWT token
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

/**
 * POST /api/auth/sync-token
 * Gets the currently authenticated user and returns a valid JWT token for client-side use
 */
export async function POST(request: Request) {
  try {
    // Get the current NextAuth session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("[SYNC-TOKEN] No session found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, username: true },
    });

    if (!user) {
      console.log("[SYNC-TOKEN] User not found:", session.user.email);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a valid JWT token with correct user ID
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[SYNC-TOKEN] JWT_SECRET not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      secret,
      { expiresIn: "7d" }
    );

    console.log("[SYNC-TOKEN] Generated token for user:", user.id, user.email);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("[SYNC-TOKEN] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/sync-token
 * Verify current authentication and return user info
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, username: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("[SYNC-TOKEN] User verified:", user.id, user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("[SYNC-TOKEN] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
