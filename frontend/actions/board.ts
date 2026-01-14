/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** board
 */

"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const CreateBoardSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
});

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

export async function createBoardAction(prevState: any, formData: FormData) {
  const userId = await getUserId();
  if (!userId) return { error: "Non authentifié" };

  const title = formData.get("title") as string;
  const validated = CreateBoardSchema.safeParse({ title });

  if (!validated.success) return { error: "Titre invalide." };

  try {
    let workspace = await prisma.workspace.findFirst({
      where: { owner_id: userId },
    });

    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          owner_id: userId,
          description: "Mon Espace",
          status: "active",
        },
      });
    }

    await prisma.board.create({
      data: {
        title,
        workspace_id: workspace.id,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de la création." };
  }
}
