/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const boardId = body.boardId ? Number(body.boardId) : null;
  if (!boardId || Number.isNaN(boardId))
    return NextResponse.json({ error: "Invalid board id" }, { status: 400 });
  const board = await prisma.board.findFirst({
    where: { id: boardId, workspace: { owner_id: Number(userId) } },
  });
  if (!board)
    return NextResponse.json(
      { error: "Board not found or access denied" },
      { status: 404 }
    );

  const title = (body.title || "Nouvelle liste").slice(0, 255);
  const maxPos = await prisma.list.aggregate({
    where: { board_id: boardId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  const list = await prisma.list.create({
    data: { board_id: boardId, title, position },
  });

  return NextResponse.json(list);
}
