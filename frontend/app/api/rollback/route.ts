import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

async function getUserId(token: string | undefined) {
  if (!token) return null;
  try {
    const decoded = jwt.decode(token) as { userId: number };
    return decoded?.userId;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const userId = await getUserId(token);

  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { actionHistoryId, boardId } = await request.json();

    // Get the action history record
    const actionHistory = await prisma.actionHistory.findUnique({
      where: { id: actionHistoryId },
    });

    if (!actionHistory) {
      return NextResponse.json(
        { error: "Action non trouvée" },
        { status: 404 }
      );
    }

    if (actionHistory.rolled_back) {
      return NextResponse.json(
        { error: "Cette action a déjà été annulée" },
        { status: 400 }
      );
    }

    // Verify user has permission - check if owner or admin member
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: true,
      },
    });

    if (!board) {
      return NextResponse.json(
        { error: "Tableau non trouvé" },
        { status: 404 }
      );
    }

    // Check if user is workspace owner
    const isWorkspaceOwner = board.workspace.owner_id === userId;

    // Check if user is board member with appropriate role
    const boardMember = await prisma.boardMember.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: userId,
        },
      },
    });

    const isBoardAdmin = boardMember && ["owner", "admin"].includes(boardMember.role);

    if (!isWorkspaceOwner && !isBoardAdmin) {
      return NextResponse.json(
        { error: "Vous n'avez pas les permissions nécessaires" },
        { status: 403 }
      );
    }

    // Rollback logic
    switch (actionHistory.action_type) {
      case "create_card": {
        await prisma.card.delete({
          where: { id: actionHistory.entity_id },
        });
        break;
      }

      case "delete_card": {
        if (actionHistory.previous_state) {
          const previousData = actionHistory.previous_state as any;
          await prisma.card.create({
            data: {
              id: actionHistory.entity_id,
              title: previousData.title,
              description: previousData.description,
              list_id: previousData.list_id,
              label_id: previousData.label_id,
              start_date: new Date(previousData.start_date),
              due_date: new Date(previousData.due_date),
              position: previousData.position,
            },
          });
        }
        break;
      }

      case "update_card": {
        if (actionHistory.previous_state) {
          const previousData = actionHistory.previous_state as any;
          await prisma.card.update({
            where: { id: actionHistory.entity_id },
            data: {
              title: previousData.title,
              description: previousData.description,
              label_id: previousData.label_id,
              start_date: new Date(previousData.start_date),
              due_date: new Date(previousData.due_date),
              position: previousData.position,
            },
          });
        }
        break;
      }

      case "create_list": {
        await prisma.list.delete({
          where: { id: actionHistory.entity_id },
        });
        break;
      }

      case "delete_list": {
        if (actionHistory.previous_state) {
          const previousData = actionHistory.previous_state as any;
          await prisma.list.create({
            data: {
              id: actionHistory.entity_id,
              title: previousData.title,
              board_id: previousData.board_id,
              position: previousData.position,
            },
          });
        }
        break;
      }

      case "update_list": {
        if (actionHistory.previous_state) {
          const previousData = actionHistory.previous_state as any;
          await prisma.list.update({
            where: { id: actionHistory.entity_id },
            data: {
              title: previousData.title,
              position: previousData.position,
            },
          });
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: "Type d'action non supporté" },
          { status: 400 }
        );
    }

    // Mark action as rolled back
    await prisma.actionHistory.update({
      where: { id: actionHistoryId },
      data: {
        rolled_back: true,
        rolled_back_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Action annulée avec succès",
    });
  } catch (error) {
    console.error("Rollback error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de l'action" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const userId = await getUserId(token);

  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const boardId = Number(request.nextUrl.searchParams.get("boardId"));
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 10;

    // Verify user has access to board
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: true,
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Tableau non trouvé" }, { status: 404 });
    }

    // Check if user is workspace owner
    const isWorkspaceOwner = board.workspace.owner_id === userId;

    // Check if user is board member
    const boardMember = await prisma.boardMember.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: userId,
        },
      },
    });

    if (!isWorkspaceOwner && !boardMember) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const actionHistory = await prisma.actionHistory.findMany({
      where: {
        board_id: boardId,
        rolled_back: false,
      },
      orderBy: { created_at: "desc" },
      take: limit,
      include: {
        user: {
          select: { username: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: actionHistory,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
}
