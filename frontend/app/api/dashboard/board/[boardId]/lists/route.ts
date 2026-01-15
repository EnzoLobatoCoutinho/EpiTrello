/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route (Create List)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "redis";
import { getUserIdFromRequest } from "@/lib/auth-utils";

const redis = createClient({ url: "redis://redis:6379" });
redis.on("error", (err) => console.error("Redis Client Error", err));

async function getRedisClient() {
  if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idBoard = Number(boardId);
    if (isNaN(idBoard)) {
      return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
    }

    const body = await req.json();
    const title = body.title?.trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const lastList = await prisma.list.findFirst({
      where: { board_id: idBoard },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const newPosition = lastList ? lastList.position + 1 : 0;

    const newList = await prisma.list.create({
      data: {
        title,
        board_id: idBoard,
        position: newPosition,
      },
    });

    // Log action history
    try {
      await prisma.actionHistory.create({
        data: {
          board_id: idBoard,
          user_id: userId,
          action_type: "create_list",
          entity_type: "list",
          entity_id: newList.id,
          new_state: newList,
        },
      });
    } catch (e) {
      console.error("Error logging action history:", e);
    }

    try {
      const client = await getRedisClient();
      await client.publish(
        "board-events",
        JSON.stringify({
          boardId: idBoard,
          event: "list-added",
          data: newList,
        })
      );
    } catch (redisError) {
      console.error("Erreur Redis (List Create):", redisError);
    }

    return NextResponse.json(newList);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create list" },
      { status: 500 }
    );
  }
}
