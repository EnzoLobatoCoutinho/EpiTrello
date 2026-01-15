/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** session-provider client wrapper
*/

"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function SessionProviderWrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
