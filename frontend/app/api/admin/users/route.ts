/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** Admin Users API - List & Create
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUserIdFromRequest } from "@/lib/auth-utils";

// GET - List all users with their workspaces
export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users with their workspaces
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        workspaces: {
          select: {
            id: true,
            description: true,
            status: true,
            boards: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET Users Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, username, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        username: username?.trim() || email.split("@")[0],
        password: hashedPassword,
      },
      select: { id: true, email: true, username: true },
    });

    // Create default workspace
    try {
      const workspace = await prisma.workspace.create({
        data: {
          owner_id: user.id,
          description: `${user.username}'s workspace`,
          status: "active",
        },
      });

      return NextResponse.json({
        message: "Utilisateur créé avec succès",
        user: { ...user, workspaceId: workspace.id },
      });
    } catch (wsErr) {
      // Rollback user creation if workspace creation fails
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      console.error("Failed to create workspace for new user:", wsErr);
      return NextResponse.json(
        { error: "Échec de création du workspace" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("POST User Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
