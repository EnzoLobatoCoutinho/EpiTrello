/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** board
 */

import { z } from "zod";

export const CreateBoardSchema = z.object({
  title: z.string().min(3, {
    message: "Le titre du tableau doit faire au moins 3 caractères.",
  }),
  workspace_id: z.number().min(1, {
    message: "Un workspace est requis.",
  }),
});

export const UpdateBoardSchema = z.object({
  title: z.string().min(3).optional(),
  background: z.string().optional(),
});

export const CreateListSchema = z.object({
  title: z.string().min(1, {
    message: "Le titre de la liste est requis.",
  }),
  board_id: z.number(),
});

export const UpdateListOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.number(),
      position: z.number(),
    })
  ),
});

export const CreateCardSchema = z.object({
  title: z.string().min(1, {
    message: "Le titre de la carte est requis.",
  }),
  list_id: z.number(),
  description: z.string().optional(),
});

export const UpdateCardSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  start_date: z.date().optional(),
  due_date: z.date().optional(),
  position: z.number().optional(),
  list_id: z.number().optional(),
});
