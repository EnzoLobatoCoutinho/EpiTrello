/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** auth
 */

import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email({
    message: "L'adresse email est invalide.",
  }),
  password: z.string().min(1, {
    message: "Le mot de passe est requis.",
  }),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "L'adresse email est invalide.",
  }),
  username: z.string().min(3, {
    message: "Le nom d'utilisateur doit faire au moins 3 caractères.",
  }),
  password: z.string().min(6, {
    message: "Le mot de passe doit faire au moins 6 caractères.",
  }),
});
