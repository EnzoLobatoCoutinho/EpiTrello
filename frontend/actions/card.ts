/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** card
 */

"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "redis";
const redis = createClient({ url: "redis://redis:6379" });

redis.connect();
const CreateCardSchema = z.object({
  title: z.string().min(1),
  listId: z.number(),
  boardId: z.number(),
});

export async function createCardAction(formData: FormData) {
  const title = formData.get("title") as string;
  const listId = Number(formData.get("listId"));
  const boardId = Number(formData.get("boardId"));

  const validated = CreateCardSchema.safeParse({ title, listId, boardId });

  if (!validated.success) return { error: "Données invalides." };

  try {
    const lastCard = await prisma.card.findFirst({
      where: { list_id: listId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const newPosition =
      lastCard && lastCard.position ? lastCard.position + 1 : 1;

    const newCard = await prisma.card.create({
      data: {
        title,
        list_id: listId,
        position: newPosition,
        description: "",
        start_date: new Date(),
        due_date: new Date(),
      },
    });

    const payload = {
      boardId: 1,
      event: "card-moved",
      data: newCard,
    };

    await redis.publish("board-events", JSON.stringify(payload));

    revalidatePath(`/dashboard/board/${boardId}`);
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de la création de la carte." };
  }
}
