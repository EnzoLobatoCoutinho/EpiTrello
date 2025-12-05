/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** auth-service
 */

import prisma from "@/lib/prisma";
import { RegisterSchema } from "@/schemas/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

export const getUserById = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

export const registerUser = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    throw new Error("Champs invalides");
  }

  const { email, password, username } = validatedFields.data;

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("Cet email est déjà utilisé.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
    },
  });

  return user;
};
