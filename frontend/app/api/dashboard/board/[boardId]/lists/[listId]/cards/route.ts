/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route (Create Card)
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
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
    const title = body.title?.trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const list = await prisma.list.findUnique({
      where: { id: idList },
      select: { id: true, board_id: true },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    const lastCard = await prisma.card.findFirst({
      where: { list_id: idList },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const newPosition = (lastCard?.position ?? -1) + 1;

    // Prepare checklist items if provided
    const checklistData = Array.isArray(body.checklist)
      ? body.checklist.map((it: any) => ({
          title: String(it.title || ""),
          checked: !!it.checked,
          position: it.position ?? null,
        }))
      : undefined;

    // Create the card first
    const newCard = await prisma.card.create({
      data: {
        title,
        list_id: idList,
        position: newPosition,
        description: body.description || "",
        start_date: body.start_date ? new Date(body.start_date) : new Date(),
        due_date: body.due_date ? new Date(body.due_date) : new Date(),
        label_id: body.label_id ? Number(body.label_id) : null,
      },
    });

    // If checklist items provided, create them separately and attach to the card
    let checklistItems: any[] = [];
    if (Array.isArray(checklistData) && checklistData.length > 0) {
      try {
        // map to include card_id
        const toCreate = checklistData.map((it: any) => ({ ...it, card_id: newCard.id }));
        // Use createMany if available
        try {
          await prisma.checklistItem.createMany({ data: toCreate });
        } catch (e) {
          // fallback to individual creates if createMany not supported by client
          await prisma.$transaction(toCreate.map((d: any) => prisma.checklistItem.create({ data: d })));
        }

        checklistItems = await prisma.checklistItem.findMany({ where: { card_id: newCard.id } });
      } catch (e) {
        console.error("Error creating checklist items:", e);
      }
    }

    const cardWithChecklist = checklistItems.length ? { ...newCard, checklist: checklistItems } : newCard;

    try {
      const client = await getRedisClient();
      await client.publish(
        "board-events",
        JSON.stringify({
          boardId: list.board_id,
          event: "card-moved",
          data: newCard,
        })
      );
    } catch (e) {
      console.error("Redis Error", e);
    }

    return NextResponse.json(newCard);
  } catch (error) {
    console.error("Create Card Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
