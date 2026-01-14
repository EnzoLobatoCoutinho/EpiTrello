/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** settings
 */

import { z } from "zod";

export const UpdateProfileSchema = z.object({
  username: z.string().min(2, "Le nom doit faire au moins 2 caractères."),
});

export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis."),
    newPassword: z
      .string()
      .min(6, "Le nouveau mot de passe doit faire au moins 6 caractères."),
    confirmPassword: z.string().min(1, "Confirmation requise."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });
