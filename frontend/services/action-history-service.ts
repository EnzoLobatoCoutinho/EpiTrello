/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** action-history-service
 */

import prisma from "@/lib/prisma";

interface LogActionHistoryParams {
  boardId: number;
  userId: number;
  actionType: string;
  entityType: string;
  entityId: number;
  previousState?: any;
  newState?: any;
}

export async function logActionHistory({
  boardId,
  userId,
  actionType,
  entityType,
  entityId,
  previousState,
  newState,
}: LogActionHistoryParams) {
  try {
    await prisma.actionHistory.create({
      data: {
        board_id: boardId,
        user_id: userId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId,
        previous_state: previousState ? JSON.stringify(previousState) : null,
        new_state: newState ? JSON.stringify(newState) : null,
      },
    });
  } catch (error) {
    console.error("Error logging action history:", error);
    // Ne pas bloquer l'action si l'enregistrement échoue
  }
}
