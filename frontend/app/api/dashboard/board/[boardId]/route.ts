/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** route (GET Board)
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-utils";

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

    const userId = await getUserIdFromRequest(req);
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
        labels: true,
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Helper to load checklist items for a card with fallback to raw SQL
    async function loadChecklistForCard(cardId: number) {
      if ((prisma as any).checklistItem && typeof (prisma as any).checklistItem.findMany === "function") {
        try {
          return await (prisma as any).checklistItem.findMany({ 
            where: { card_id: cardId },
            orderBy: { position: "asc" }
          });
        } catch (e) {
          console.error("Failed to load checklist via Prisma:", e);
        }
      }
      // Fallback: raw query
      try {
        const rows: any[] = await prisma.$queryRaw`
          SELECT id, card_id, title, checked, position, "createdAt", "updatedAt"
          FROM "ChecklistItem"
          WHERE card_id = ${cardId}
          ORDER BY position NULLS LAST, id
        `;
        return rows || [];
      } catch (rqErr) {
        console.error("Raw query for checklist items failed:", rqErr);
        return [];
      }
    }

    // Load checklists for all cards
    const allCards = board.lists.flatMap(l => l.cards || []);
    const checklistsByCardId: Record<number, any[]> = {};
    
    await Promise.all(
      allCards.map(async (card) => {
        checklistsByCardId[card.id] = await loadChecklistForCard(card.id);
      })
    );

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
        checklist: checklistsByCardId[c.id] || [],
      })),
    }));

    const labels = (board.labels || []).map((l) => ({
      id: l.id,
      board_id: l.board_id,
      name: l.name,
      color: l.color,
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
      labels,
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
