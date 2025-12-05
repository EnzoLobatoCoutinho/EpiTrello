/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route (Update/Delete Card)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
const redis = createClient({ url: redisUrl });
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
  { params }: { params: Promise<{ listId: string; cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const userId = await getUserIdFromReq(req);

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const idCard = Number(cardId);
    const body = await req.json();

    const existingCard = await prisma.card.findUnique({
      where: { id: idCard },
    });
    if (!existingCard)
      return NextResponse.json({ error: "Card not found" }, { status: 404 });

    const updateData: any = {};
    if (body.title !== undefined)
      updateData.title = String(body.title).slice(0, 255);
    if (body.description !== undefined)
      updateData.description = String(body.description);
    if (body.start_date !== undefined)
      updateData.start_date = body.start_date
        ? new Date(body.start_date)
        : null;
    if (body.due_date !== undefined)
      updateData.due_date = body.due_date ? new Date(body.due_date) : null;
    if (body.label_id !== undefined)
      updateData.label_id = body.label_id ? Number(body.label_id) : null;
    if (body.list_id !== undefined) updateData.list_id = Number(body.list_id);
    if (body.position !== undefined)
      updateData.position = Number(body.position);

    const updatedCard = await prisma.card.update({
      where: { id: idCard },
      data: updateData,
    });

    try {
      console.log(
        "🔍 Recherche du Board ID pour la liste:",
        updatedCard.list_id
      );

      const parentList = await prisma.list.findUnique({
        where: { id: updatedCard.list_id },
        select: { board_id: true },
      });

      if (parentList) {
        console.log(
          "📢 Publication Redis vers board-events pour Board:",
          parentList.board_id
        );

        const client = await getRedisClient();

        const message = JSON.stringify({
          boardId: parentList.board_id,
          event: "card-moved",
          data: updatedCard,
        });

        const published = await client.publish("board-events", message);
        console.log(`✅ Message publié ! Subscribers touchés : ${published}`);
      } else {
        console.error(
          "❌ Impossible de trouver le Board parent pour cette liste !"
        );
      }
    } catch (redisError) {
      console.error("⚠️ CRASH REDIS DANS PUT:", redisError);
    }

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("PUT Card Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ listId: string; cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const userId = await getUserIdFromReq(req);

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const idCard = Number(cardId);

    const cardToDelete = await prisma.card.findUnique({
      where: { id: idCard },
      include: { list: { select: { board_id: true } } },
    });

    if (!cardToDelete)
      return NextResponse.json({ error: "Card not found" }, { status: 404 });

    await prisma.card.delete({
      where: { id: idCard },
    });

    try {
      const client = await getRedisClient();
      await client.publish(
        "board-events",
        JSON.stringify({
          boardId: cardToDelete.list.board_id,
          event: "card-deleted",
          data: { id: idCard },
        })
      );
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Card Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
