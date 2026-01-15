/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getUserIdFromRequest } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const id = await getUserIdFromRequest(req);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    select: { id: true, email: true, username: true },
  });
  if (!user)
    return NextResponse.json(
      { error: "Utilisateur introuvable" },
      { status: 404 }
    );
  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const id = await getUserIdFromRequest(req);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, currentPassword, newPassword } = body;

  try {
    if (name) {
      const user = await prisma.user.update({
        where: { id: Number(id) },
        data: { username: String(name) },
        select: { id: true, username: true, email: true },
      });
      return NextResponse.json({ user });
    }

    if (newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
        select: { password: true },
      });
      if (!user || !user.password)
        return NextResponse.json(
          { error: "Utilisateur introuvable" },
          { status: 404 }
        );
      const ok = await bcrypt.compare(currentPassword || "", user.password);
      if (!ok)
        return NextResponse.json(
          { error: "Mot de passe actuel incorrect" },
          { status: 401 }
        );
      const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
      const hashed = await bcrypt.hash(newPassword, saltRounds);
      await prisma.user.update({
        where: { id: Number(id) },
        data: { password: hashed },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Rien à mettre à jour" },
      { status: 400 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const id = await getUserIdFromRequest(req);
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
