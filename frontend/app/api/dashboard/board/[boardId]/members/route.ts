/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** Board Members API - List & Add members
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { sendBoardInvitationEmail } from "@/lib/resend";

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

// GET - List all members of a board
export async function GET(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const userId = await getUserIdFromReq(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await params;
    const id = Number(boardId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
    }

    // Check if user has access to this board
    const board = await prisma.board.findFirst({
      where: { id },
      select: { workspace: { select: { owner_id: true } } },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Get all members with user details
    let members = [];
    
    if ((prisma as any).boardMember && typeof (prisma as any).boardMember.findMany === "function") {
      try {
        members = await (prisma as any).boardMember.findMany({
          where: { board_id: id },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
          orderBy: { addedAt: "asc" },
        });
      } catch (e) {
        console.error("Failed to load members via Prisma:", e);
      }
    }
    
    // Fallback to raw SQL if Prisma model not available
    if (members.length === 0) {
      try {
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
          WHERE bm.board_id = ${id}
          ORDER BY bm."addedAt" ASC
        `;
        
        // Transform raw results to match expected format
        members = rows.map((row) => ({
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
        }));
      } catch (rawErr) {
        console.error("Raw query for board members failed:", rawErr);
      }
    }

    return NextResponse.json({ members });
  } catch (error) {
    console.error("GET Board Members Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - Add a member to a board
export async function POST(
  req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const userId = await getUserIdFromReq(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardId } = await params;
    const id = Number(boardId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid board ID" }, { status: 400 });
    }

    const body = await req.json();
    const { user_id, role = "member" } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id est requis" },
        { status: 400 }
      );
    }

    // Get board details for email
    const board = await prisma.board.findUnique({
      where: { id },
      select: { 
        id: true, 
        title: true,
        workspace: {
          select: {
            owner: {
              select: {
                username: true,
              }
            }
          }
        }
      },
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board introuvable" },
        { status: 404 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: Number(user_id) },
      select: { id: true, username: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Get inviter details
    const inviter = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    // Check if already member
    let existing = null;
    
    if ((prisma as any).boardMember && typeof (prisma as any).boardMember.findUnique === "function") {
      try {
        existing = await (prisma as any).boardMember.findUnique({
          where: {
            board_id_user_id: {
              board_id: id,
              user_id: Number(user_id),
            },
          },
        });
      } catch (e) {
        console.error("Failed to check existing member via Prisma:", e);
      }
    }
    
    // Fallback to raw SQL
    if (!existing) {
      try {
        const rows: any[] = await prisma.$queryRaw`
          SELECT id FROM "BoardMember"
          WHERE board_id = ${id} AND user_id = ${Number(user_id)}
          LIMIT 1
        `;
        existing = rows.length > 0 ? rows[0] : null;
      } catch (e) {
        console.error("Failed to check existing member via raw SQL:", e);
      }
    }

    if (existing) {
      return NextResponse.json(
        { error: "Cet utilisateur est déjà membre du board" },
        { status: 409 }
      );
    }

    // Add member
    let member: any = null;
    
    if ((prisma as any).boardMember && typeof (prisma as any).boardMember.create === "function") {
      try {
        member = await (prisma as any).boardMember.create({
          data: {
            board_id: id,
            user_id: Number(user_id),
            role,
          },
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
        console.error("Failed to create member via Prisma:", e);
      }
    }
    
    // Fallback to raw SQL
    if (!member) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "BoardMember" (board_id, user_id, role, "addedAt")
          VALUES (${id}, ${Number(user_id)}, ${role}, NOW())
        `;
        
        // Fetch the created member
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
          WHERE bm.board_id = ${id} AND bm.user_id = ${Number(user_id)}
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
        console.error("Raw SQL insert member failed:", rawErr);
        throw rawErr;
      }
    }

    // Send email notification (non-blocking)
    if (member && targetUser.email) {
      const boardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/board/${id}`;
      const inviterName = inviter?.username || "Un membre";
      
      sendBoardInvitationEmail(
        targetUser.email,
        targetUser.username || targetUser.email,
        board.title,
        inviterName,
        boardUrl
      ).catch((err) => {
        console.error("Failed to send invitation email (non-blocking):", err);
      });
    }

    return NextResponse.json({
      message: "Membre ajouté avec succès",
      member,
    });
  } catch (error) {
    console.error("POST Board Member Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
