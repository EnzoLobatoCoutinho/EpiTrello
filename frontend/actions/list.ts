/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** list
 */

"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const CreateListSchema = z.object({
  title: z.string().min(1),
  boardId: z.number(),
});

export async function createListAction(formData: FormData) {
  const title = formData.get("title") as string;
  const boardId = Number(formData.get("boardId"));

  const validated = CreateListSchema.safeParse({ title, boardId });

  if (!validated.success) return { error: "Données invalides." };

  try {
    const lastList = await prisma.list.findFirst({
      where: { board_id: boardId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const newPosition = lastList ? lastList.position + 1 : 1;

    await prisma.list.create({
      data: {
        title,
        board_id: boardId,
        position: newPosition,
      },
    });

    revalidatePath(`/dashboard/board/${boardId}`);
    return { success: true };
  } catch (error) {
    return { error: "Erreur serveur." };
  }
}
