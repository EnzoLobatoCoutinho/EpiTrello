/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route (labels POST)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const id = Number(boardId);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });

    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name = body.name?.toString()?.trim();
    const color = body.color?.toString() || "#8B5CF6";

    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    // Create label
    const created = await prisma.label.create({
      data: {
        board_id: id,
        name,
        color,
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
