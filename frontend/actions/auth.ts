/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** auth
 */

"use server";

import prisma from "@/lib/prisma";
import { LoginSchema, RegisterSchema } from "@/schemas/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validated = LoginSchema.safeParse({ email, password });

  if (!validated.success) {
    return { error: "Champs invalides." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { error: "Identifiants incorrects." };
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "secret_par_defaut",
      { expiresIn: "7d" }
    );

    (await cookies()).set("token", token, {
      httpOnly: false,  // Permettre l'accès depuis JS
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { success: true, token };
  } catch (error) {
    return { error: "Une erreur est survenue." };
  }
}

export async function registerAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validated = RegisterSchema.safeParse({ username, email, password });

  if (!validated.success) {
    return { error: "Données invalides." };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { error: "Cet email est déjà utilisé." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
  } catch (error) {
    return { error: "Erreur lors de la création du compte." };
  }

  redirect("/login");
}
