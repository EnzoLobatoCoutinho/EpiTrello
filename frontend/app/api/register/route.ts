/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email déjà utilisé" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(
      password,
      Number(process.env.SALT_ROUNDS ?? 10)
    );
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashed,
        username: username?.trim() || null,
      },
      select: { id: true, email: true, username: true },
    });

    let workspace;
    try {
      workspace = await prisma.workspace.create({
        data: {
          owner_id: user.id,
          description: `${user.username ?? user.email}'s workspace`,
          status: "active",
        },
        select: { id: true, owner_id: true, description: true, status: true },
      });
    } catch (e) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      console.error(
        "Failed to create workspace for new user, rolled back user creation",
        e
      );
      return NextResponse.json(
        { error: "Erreur lors de la création du workspace" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: `Bienvenue ${user.username}!`, user, workspace },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
