/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route (Update List / Move List)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "redis";
import { getUserIdFromRequest } from "@/lib/auth-utils";

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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ boardId: string; listId: string }> }
) {
  try {
    const { listId } = await params;
    const userId = await getUserIdFromRequest(req);

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

    const existingList = await prisma.list.findUnique({
      where: { id: idList },
    });

    const updatedList = await prisma.list.update({
      where: { id: idList },
      data: updateData,
    });

    // Log action history
    if (existingList) {
      try {
        await prisma.actionHistory.create({
          data: {
            board_id: updatedList.board_id,
            user_id: userId,
            action_type: "update_list",
            entity_type: "list",
            entity_id: idList,
            previous_state: existingList,
            new_state: updatedList,
          },
        });
      } catch (e) {
        console.error("Error logging action history:", e);
      }
    }

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
    const userId = await getUserIdFromRequest(req);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const listToDelete = await prisma.list.findUnique({
      where: { id: Number(listId) },
    });

    if (!listToDelete)
      return NextResponse.json({ error: "List not found" }, { status: 404 });

    // Log action history before deletion
    try {
      await prisma.actionHistory.create({
        data: {
          board_id: listToDelete.board_id,
          user_id: userId,
          action_type: "delete_list",
          entity_type: "list",
          entity_id: Number(listId),
          previous_state: listToDelete,
        },
      });
    } catch (e) {
      console.error("Error logging action history:", e);
    }

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
