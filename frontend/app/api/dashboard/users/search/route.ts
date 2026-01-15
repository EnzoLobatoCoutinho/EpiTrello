/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** API to search users for adding to board
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-utils";

// GET - Search users (excluding current board members)
export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const boardId = searchParams.get("boardId");

    if (!boardId) {
      return NextResponse.json(
        { error: "boardId parameter required" },
        { status: 400 }
      );
    }

    // Get current board members
    let memberIds: number[] = [];
    
    if ((prisma as any).boardMember && typeof (prisma as any).boardMember.findMany === "function") {
      try {
        const boardMembers = await (prisma as any).boardMember.findMany({
          where: { board_id: Number(boardId) },
          select: { user_id: true },
        });
        memberIds = boardMembers.map((m: any) => m.user_id);
      } catch (e) {
        console.error("Failed to get board members via Prisma:", e);
      }
    }
    
    // Fallback to raw SQL
    if (memberIds.length === 0) {
      try {
        const rows: any[] = await prisma.$queryRaw`
          SELECT user_id FROM "BoardMember"
          WHERE board_id = ${Number(boardId)}
        `;
        memberIds = rows.map((r) => r.user_id);
      } catch (rawErr) {
        console.error("Raw SQL get board members failed:", rawErr);
      }
    }

    // Search users not in board
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          {
            id: { notIn: memberIds.length > 0 ? memberIds : undefined },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Search Users Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
