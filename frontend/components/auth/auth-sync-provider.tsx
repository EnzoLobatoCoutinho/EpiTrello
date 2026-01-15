/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** Client-side auth sync component
*/

"use client";

import { useAuthSync } from "@/lib/useAuthSync";

export function AuthSyncProvider() {
  useAuthSync();
  return null;
}
