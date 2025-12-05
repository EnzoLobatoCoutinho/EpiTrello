/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route (GET Board)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function getUserIdFromReq(req: Request) {
  const auth = req.headers.get("authorization") || "";
  let token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value || null;
  }

  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET || "dev_secret";
    const payload: any = jwt.verify(token, secret);
    return payload?.id ?? payload?.userId ?? null;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    const id = Number(boardId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
    }

    const userId = await getUserIdFromReq(req);
    if (!userId) {
      console.log("⛔ Unauthorized: Pas de token valide");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const board = await prisma.board.findFirst({
      where: {
        id: id,
      },
      include: {
        lists: {
          orderBy: { position: "asc" },
          include: {
            cards: { orderBy: { position: "asc" } },
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const lists = (board.lists || []).map((l) => ({
      id: l.id,
      title: l.title,
      position: l.position,
      cards: (l.cards || []).map((c) => ({
        id: c.id,
        list_id: c.list_id,
        label_id: c.label_id,
        title: c.title,
        description: c.description,
        start_date: c.start_date,
        due_date: c.due_date,
        position: c.position,
      })),
    }));

    const totalCards = lists.reduce((acc, l) => acc + l.cards.length, 0);
    const colorClasses = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-yellow-500",
      "bg-red-500",
    ];
    const color = colorClasses[id % colorClasses.length];

    return NextResponse.json({
      board: { id: board.id, title: board.title, color },
      lists: lists,
      boardsData: {
        [String(board.id)]: { name: board.title, color, tasks: totalCards },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
