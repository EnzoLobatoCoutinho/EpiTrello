/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route (Update/Delete Card)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createClient } from "redis";
import { getUserIdFromRequest } from "@/lib/auth-utils";
import { updateCalendarEvent, createCalendarEvent, deleteCalendarEvent } from "@/lib/google-calendar";

const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
const redis = createClient({ url: redisUrl });
redis.on("error", (err) => console.error("Redis Client Error", err));

async function getRedisClient() {
  if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ listId: string; cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const userId = await getUserIdFromRequest(req);

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const idCard = Number(cardId);
    const body = await req.json();
    console.log("PUT card payload (partial):", {
      id: idCard,
      hasChecklist: Array.isArray(body.checklist),
      checklistLength: Array.isArray(body.checklist) ? body.checklist.length : 0,
    });

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

    // Sync with Google Calendar
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { googleCalendarToken: true }
      });

      if (user?.googleCalendarToken) {
        if (updatedCard.googleEventId) {
          // Update existing event
          await updateCalendarEvent(userId, updatedCard.googleEventId, {
            title: updatedCard.title,
            description: updatedCard.description,
            start_date: updatedCard.start_date,
            due_date: updatedCard.due_date,
          });
          console.log('✅ Google Calendar event updated');
        } else {
          // Create new event if doesn't exist
          const googleEventId = await createCalendarEvent(userId, {
            title: updatedCard.title,
            description: updatedCard.description,
            start_date: updatedCard.start_date,
            due_date: updatedCard.due_date,
          });

          if (googleEventId) {
            await prisma.card.update({
              where: { id: idCard },
              data: { googleEventId },
            });
            console.log('✅ Card synced to Google Calendar:', googleEventId);
          }
        }
      }
    } catch (calError) {
      console.error('Failed to sync with Google Calendar:', calError);
    }

    // Log action history for card update
    try {
      const parentList = await prisma.list.findUnique({
        where: { id: updatedCard.list_id },
        select: { board_id: true },
      });
      if (parentList) {
        await prisma.actionHistory.create({
          data: {
            board_id: parentList.board_id,
            user_id: userId,
            action_type: "update_card",
            entity_type: "card",
            entity_id: idCard,
            previous_state: existingCard,
            new_state: updatedCard,
          },
        });
      }
    } catch (e) {
      console.error("Error logging action history:", e);
    }

      if (body.checklist !== undefined) {
      console.log("Synchronizing checklist for card", idCard);
      try {
          console.log("prisma keys:", Object.keys(prisma));
          const incoming: any[] = Array.isArray(body.checklist) ? body.checklist : [];
          // Helper to load existing checklist items with fallback to raw SQL
          async function loadExistingItems(cardIdNum: number) {
            if ((prisma as any).checklistItem && typeof (prisma as any).checklistItem.findMany === "function") {
              return (prisma as any).checklistItem.findMany({ where: { card_id: cardIdNum } });
            }
            // Fallback: raw query (column names match Prisma schema)
            try {
              const rows: any[] = await prisma.$queryRaw`
                SELECT id, card_id, title, checked, position, "createdAt", "updatedAt"
                FROM "ChecklistItem"
                WHERE card_id = ${cardIdNum}
                ORDER BY position NULLS LAST, id
              `;
              return rows || [];
            } catch (rqErr) {
              console.error("Raw query for checklist items failed:", rqErr);
              return [];
            }
          }

          const existing = await loadExistingItems(idCard);
          console.log("Checklist existing/incoming lengths", existing.length, incoming.length);
          const existingIds = existing.map((e) => e.id);
          const incomingIds = incoming.filter((i) => i.id && Number(i.id) > 0).map((i) => Number(i.id));

        console.log("existingIds", existingIds);
        console.log("incomingIds", incomingIds);

        const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

        const ops: any[] = [];

        if (toDelete.length > 0) {
          if ((prisma as any).checklistItem && typeof (prisma as any).checklistItem.deleteMany === "function") {
            ops.push((prisma as any).checklistItem.deleteMany({ where: { id: { in: toDelete } } }));
          } else {
            // fallback to raw deletes
            for (const did of toDelete) {
              ops.push(prisma.$executeRaw`DELETE FROM "ChecklistItem" WHERE id = ${did}`);
            }
          }
        }

        // Updates for existing items
        for (const item of incoming.filter((i) => i.id && Number(i.id) > 0)) {
          const iid = Number(item.id);
          if ((prisma as any).checklistItem && typeof (prisma as any).checklistItem.update === "function") {
            ops.push(
              (prisma as any).checklistItem.update({
                where: { id: iid },
                data: {
                  title: String(item.title || ""),
                  checked: !!item.checked,
                  position: item.position ?? null,
                },
              })
            );
          } else {
            ops.push(prisma.$executeRaw`
              UPDATE "ChecklistItem"
              SET title = ${String(item.title || "")}, checked = ${!!item.checked}, position = ${item.position ?? null}, "updatedAt" = now()
              WHERE id = ${iid}
            `);
          }
        }

        for (const item of incoming.filter((i) => !i.id || Number(i.id) <= 0)) {
          if ((prisma as any).checklistItem && typeof (prisma as any).checklistItem.create === "function") {
            ops.push(
              (prisma as any).checklistItem.create({
                data: {
                  card_id: idCard,
                  title: String(item.title || ""),
                  checked: !!item.checked,
                  position: item.position ?? null,
                },
              })
            );
          } else {
            ops.push(prisma.$executeRaw`
              INSERT INTO "ChecklistItem" (card_id, title, checked, position, "createdAt", "updatedAt")
              VALUES (${idCard}, ${String(item.title || "")}, ${!!item.checked}, ${item.position ?? null}, now(), now())
            `);
          }
        }

        if (ops.length > 0) {
          console.log("Executing checklist ops", ops.length);
          // Use $transaction to run all operations in a single transaction where possible
          try {
            await prisma.$transaction(ops as any[]);
          } catch (txErr) {
            console.error("Transaction of checklist ops failed:", txErr);
            // As a last resort, try to run ops sequentially to surface errors
            for (const op of ops) {
              try {
                await op;
              } catch (singleErr) {
                console.error("Checklist op failed:", singleErr);
              }
            }
          }
        } else {
          console.log("No checklist ops to run");
        }
      } catch (cErr) {
        console.error("Checklist sync error:", cErr);
      }

      // reload card and its checklist via separate queries (avoid include to be robust
      // when Prisma client generation may be out-of-date)
      const reloadedCard = await prisma.card.findUnique({ where: { id: idCard } });
      let checklistItems: any[] = [];
      try {
        checklistItems = await loadExistingItems(idCard);
      } catch (e) {
        // If checklistItem model or relation isn't available in the generated client,
        // ignore and continue returning the card without checklist.
        console.error("Warning: could not load checklist items:", e);
      }

      if (reloadedCard) {
        try {
          const parentList = await prisma.list.findUnique({ where: { id: reloadedCard.list_id }, select: { board_id: true } });
          if (parentList) {
            const client = await getRedisClient();
            const payload = checklistItems.length ? { ...reloadedCard, checklist: checklistItems } : reloadedCard;
            await client.publish("board-events", JSON.stringify({ boardId: parentList.board_id, event: "card-moved", data: payload }));
            return NextResponse.json(payload);
          }
        } catch (e) {
          console.error("Redis publish error after checklist sync", e);
        }
        const payload = checklistItems.length ? { ...reloadedCard, checklist: checklistItems } : reloadedCard;
        return NextResponse.json(payload);
      }
    }

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
    const detail = error instanceof Error ? { message: error.message, stack: error.stack } : String(error);
    return NextResponse.json({ error: "Update failed", detail }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ listId: string; cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const userId = await getUserIdFromRequest(req);

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const idCard = Number(cardId);

    const cardToDelete = await prisma.card.findUnique({
      where: { id: idCard },
      include: { list: { select: { board_id: true } } },
    });

    if (!cardToDelete)
      return NextResponse.json({ error: "Card not found" }, { status: 404 });

    // Delete from Google Calendar first
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { googleCalendarToken: true }
      });

      if (user?.googleCalendarToken && cardToDelete.googleEventId) {
        await deleteCalendarEvent(userId, cardToDelete.googleEventId);
        console.log('✅ Google Calendar event deleted:', cardToDelete.googleEventId);
      }
    } catch (calError) {
      console.error('Failed to delete from Google Calendar:', calError);
    }

    // Log action history before deletion
    try {
      await prisma.actionHistory.create({
        data: {
          board_id: cardToDelete.list.board_id,
          user_id: userId,
          action_type: "delete_card",
          entity_type: "card",
          entity_id: idCard,
          previous_state: cardToDelete,
        },
      });
    } catch (e) {
      console.error("Error logging action history:", e);
    }

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
