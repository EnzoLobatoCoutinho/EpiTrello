/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** Admin Users API - Update & Delete specific user
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUserIdFromRequest } from "@/lib/auth-utils";

// PUT - Update a user
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminId = await getUserIdFromRequest(req);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const targetUserId = Number(userId);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const { username, email, password } = body;

    const updateData: any = {};

    if (username !== undefined) {
      updateData.username = String(username).trim();
    }

    if (email !== undefined) {
      updateData.email = String(email).toLowerCase().trim();
      
      // Check if email is already taken by another user
      const existing = await prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (existing && existing.id !== targetUserId) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    if (password !== undefined && password.trim() !== "") {
      const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: { id: true, email: true, username: true },
    });

    return NextResponse.json({
      message: "Utilisateur mis à jour",
      user,
    });
  } catch (error: any) {
    console.error("PUT User Error:", error);
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user and their workspaces
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const adminId = await getUserIdFromRequest(req);
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const targetUserId = Number(userId);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Prevent self-deletion
    if (adminId === targetUserId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte via l'admin" },
        { status: 400 }
      );
    }

    // Delete user (cascade will delete workspaces and related data)
    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return NextResponse.json({
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error: any) {
    console.error("DELETE User Error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
