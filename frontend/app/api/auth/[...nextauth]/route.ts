/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** nextauth route
*/

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
