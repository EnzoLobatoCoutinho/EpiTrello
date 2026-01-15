/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** rollback
 */

"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getUserId() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.decode(token) as { userId: number };
    return decoded?.userId;
  } catch {
    return null;
  }
}

export async function rollbackActionAction(
  actionHistoryId: number,
  boardId: number
) {
  const userId = await getUserId();
  if (!userId) return { error: "Non authentifié" };

  try {
    // Get the action history record
    const actionHistory = await prisma.actionHistory.findUnique({
      where: { id: actionHistoryId },
    });

    if (!actionHistory) {
      return { error: "Action non trouvée" };
    }

    if (actionHistory.rolled_back) {
      return { error: "Cette action a déjà été annulée" };
    }

    // Verify user has permission to rollback (owner/admin of board)
    const boardMember = await prisma.boardMember.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: userId,
        },
      },
    });

    if (!boardMember || !["owner", "admin"].includes(boardMember.role)) {
      return { error: "Vous n'avez pas les permissions nécessaires" };
    }

    // Rollback based on action type
    switch (actionHistory.action_type) {
      case "create_card": {
        // Delete the card that was created
        await prisma.card.delete({
          where: { id: actionHistory.entity_id },
        });
        break;
      }

      case "delete_card": {
        // Recreate the card with previous state
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
        // Restore previous card state
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
        // Delete the list that was created
        await prisma.list.delete({
          where: { id: actionHistory.entity_id },
        });
        break;
      }

      case "delete_list": {
        // Recreate the list with previous state
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
        // Restore previous list state
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
        return { error: "Type d'action non supporté" };
    }

    // Mark action as rolled back
    await prisma.actionHistory.update({
      where: { id: actionHistoryId },
      data: {
        rolled_back: true,
        rolled_back_at: new Date(),
      },
    });

    revalidatePath(`/dashboard/board/${boardId}`);
    return { success: true, message: "Action annulée avec succès" };
  } catch (error) {
    console.error("Rollback error:", error);
    return { error: "Erreur lors de l'annulation de l'action" };
  }
}

export async function getActionHistoryAction(boardId: number, limit = 10) {
  const userId = await getUserId();
  if (!userId) return { error: "Non authentifié" };

  try {
    // Verify user has access to board
    const boardMember = await prisma.boardMember.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: userId,
        },
      },
    });

    if (!boardMember) {
      return { error: "Accès refusé" };
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

    return { success: true, data: actionHistory };
  } catch (error) {
    return { error: "Erreur lors de la récupération de l'historique" };
  }
}
