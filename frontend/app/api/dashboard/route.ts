/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

function getUserIdFromReq(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || "dev_secret";
    const payload: any = jwt.verify(token, secret);
    return payload?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const boards = await prisma.board.findMany({
      where: { workspace: { owner_id: Number(userId) } },
      include: {
        workspace: true,
        lists: { include: { _count: { select: { cards: true } } } },
      },
    });
    const response = boards.map((b) => ({
      id: b.id,
      title: b.title,
      workspaceId: b.workspace_id,
      workspaceName: b.workspace?.description ?? null,
      listsCount: b.lists?.length ?? 0,
      cardsCount: b.lists?.reduce((sum, l) => sum + (l._count?.cards ?? 0), 0),
    }));
    return NextResponse.json({ boards: response });
  } catch (error) {
    console.error(error);
    return NextResponse.error();
  }
}

export async function POST(req: Request) {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : null;
    const workspace = await prisma.workspace.findFirst({
      where: { owner_id: Number(userId) },
      include: { boards: true },
    });
    if (!workspace) {
      return NextResponse.json(
        { error: "Aucun workspace pour cet utilisateur" },
        { status: 400 }
      );
    }
    if (!title) {
      return NextResponse.json({ error: "Titre manquant" }, { status: 400 });
    }
    const newBoard = await prisma.board.create({
      data: {
        title,
        workspace_id: workspace.id,
      },
      select: { id: true, title: true, workspace_id: true },
    });
    return NextResponse.json({ board: newBoard }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
