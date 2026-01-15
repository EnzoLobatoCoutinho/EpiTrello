/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** settings
 */

"use server";

import prisma from "@/lib/prisma";
import { UpdateProfileSchema, UpdatePasswordSchema } from "@/schemas/settings";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;
  try {
    return (jwt.decode(token) as any)?.userId;
  } catch {
    return null;
  }
}

export async function getUserProfile() {
  const userId = await getUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, email: true },
  });
  return user;
}

export async function updateNameAction(formData: FormData) {
  const userId = await getUserId();
  if (!userId) return { error: "Non autorisé" };

  const username = formData.get("username") as string;
  const validated = UpdateProfileSchema.safeParse({ username });

  if (!validated.success) return { error: validated.error.issues[0].message };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { username },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch {
    return { error: "Erreur lors de la mise à jour." };
  }
}

export async function updatePasswordAction(formData: FormData) {
  const userId = await getUserId();
  if (!userId) return { error: "Non autorisé" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const validated = UpdatePasswordSchema.safeParse({
    currentPassword,
    newPassword,
    confirmPassword,
  });
  if (!validated.success) return { error: validated.error.issues[0].message };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Utilisateur introuvable" };

  if (!user.password) return { error: "Ce compte n'a pas de mot de passe (authentification OAuth)." };
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return { error: "Mot de passe actuel incorrect." };

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true };
}

export async function deleteAccountAction() {
  const userId = await getUserId();
  if (!userId) return { error: "Non autorisé" };

  await prisma.user.delete({ where: { id: userId } });

  (await cookies()).delete("token");
  redirect("/login");
}
