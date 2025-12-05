/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route (Create List)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { createClient } from "redis";

const redis = createClient({ url: "redis://redis:6379" });
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const userId = await getUserIdFromReq(req);

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
