/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** Board Members API - Update & Remove specific member
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth-utils";

// PUT - Update member role
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ boardId: string; memberId: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;
    const id = Number(memberId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
    }

    const body = await req.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json({ error: "role est requis" }, { status: 400 });
    }

    let member: any = null;
    
    if ((prisma as any).boardMember && typeof (prisma as any).boardMember.update === "function") {
      try {
        member = await (prisma as any).boardMember.update({
          where: { id },
          data: { role },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        });
      } catch (e) {
        console.error("Failed to update member via Prisma:", e);
      }
    }
    
    // Fallback to raw SQL
    if (!member) {
      try {
        await prisma.$executeRaw`
          UPDATE "BoardMember"
          SET role = ${role}
          WHERE id = ${id}
        `;
        
        // Fetch the updated member
        const rows: any[] = await prisma.$queryRaw`
          SELECT 
            bm.id, 
            bm.board_id, 
            bm.user_id, 
            bm.role, 
            bm."addedAt",
            u.id as "user.id",
            u.email as "user.email",
            u.username as "user.username"
          FROM "BoardMember" bm
          INNER JOIN "User" u ON bm.user_id = u.id
          WHERE bm.id = ${id}
          LIMIT 1
        `;
        
        if (rows.length > 0) {
          const row = rows[0];
          member = {
            id: row.id,
            board_id: row.board_id,
            user_id: row.user_id,
            role: row.role,
            addedAt: row.addedAt,
            user: {
              id: row["user.id"],
              email: row["user.email"],
              username: row["user.username"],
            },
          };
        }
      } catch (rawErr) {
        console.error("Raw SQL update member failed:", rawErr);
        throw rawErr;
      }
    }

    return NextResponse.json({
      message: "Rôle mis à jour",
      member,
    });
  } catch (error: any) {
    console.error("PUT Board Member Error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Membre introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove member from board
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ boardId: string; memberId: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;
    const id = Number(memberId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
    }

    if ((prisma as any).boardMember && typeof (prisma as any).boardMember.delete === "function") {
      try {
        await (prisma as any).boardMember.delete({
          where: { id },
        });
      } catch (e) {
        console.error("Failed to delete member via Prisma:", e);
        // Try fallback
        await prisma.$executeRaw`DELETE FROM "BoardMember" WHERE id = ${id}`;
      }
    } else {
      // Fallback to raw SQL
      await prisma.$executeRaw`DELETE FROM "BoardMember" WHERE id = ${id}`;
    }

    return NextResponse.json({
      message: "Membre retiré du board",
    });
  } catch (error: any) {
    console.error("DELETE Board Member Error:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Membre introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
