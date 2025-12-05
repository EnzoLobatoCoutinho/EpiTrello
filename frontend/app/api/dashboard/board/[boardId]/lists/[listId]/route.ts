/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route (Update List / Move List)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379",
});
redis.on("error", (err) => console.error("Redis Client Error", err));

async function getRedisClient() {
  if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
}

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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ boardId: string; listId: string }> }
) {
  try {
    const { listId } = await params;
    const userId = await getUserIdFromReq(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idList = Number(listId);
    if (isNaN(idList)) {
      return NextResponse.json({ error: "Invalid List ID" }, { status: 400 });
    }

    const body = await req.json();

    const updateData: any = {};
    if (body.title !== undefined)
      updateData.title = String(body.title).slice(0, 255);
    if (body.position !== undefined)
      updateData.position = Number(body.position);

    const updatedList = await prisma.list.update({
      where: { id: idList },
      data: updateData,
    });

    try {
      const client = await getRedisClient();
      await client.publish(
        "board-events",
        JSON.stringify({
          boardId: updatedList.board_id,
          event: "list-updated",
          data: updatedList,
        })
      );
    } catch (err) {
      console.error("Redis Error:", err);
    }

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error("PUT List Error:", error);
    return NextResponse.json(
      { error: "Failed to update list" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;
    const userId = await getUserIdFromReq(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.card.deleteMany({ where: { list_id: Number(listId) } });

    const deletedList = await prisma.list.delete({
      where: { id: Number(listId) },
    });

    try {
      const client = await getRedisClient();
      await client.publish(
        "board-events",
        JSON.stringify({
          boardId: deletedList.board_id,
          event: "list-deleted",
          data: { id: deletedList.id },
        })
      );
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
