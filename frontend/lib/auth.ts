/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** auth configuration
*/

import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const isSecure =
  process.env.NEXTAUTH_URL?.startsWith("https://") ||
  process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  useSecureCookies: isSecure,
  cookies: {
    state: {
      name: isSecure ? "__Secure-next-auth.state" : "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isSecure,
      },
    },
    sessionToken: {
      name: isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isSecure,
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.username,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google" || account?.provider === "github") {
          console.log(`[AUTH] ${account.provider} signIn for:`, user.email);
          
          // Vérifier si l'utilisateur existe déjà
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (existingUser) {
            console.log("[AUTH] User exists:", existingUser.id);
            
            // Lier le compte OAuth à l'utilisateur existant
            const updateData: any = {
              image: user.image,
              emailVerified: new Date(),
            };
            
            if (account.provider === "google" && !existingUser.googleId) {
              updateData.googleId = account.providerAccountId;
            } else if (account.provider === "github" && !(existingUser as any).githubId) {
              updateData.githubId = account.providerAccountId;
            }
            
            await prisma.user.update({
              where: { id: existingUser.id },
              data: updateData,
            });
            console.log(`[AUTH] ${account.provider} account linked to existing user`);
            
            // Vérifier si l'utilisateur a un workspace
            const workspace = await prisma.workspace.findFirst({
              where: { owner_id: existingUser.id },
            });
            
            if (!workspace) {
              console.log("[AUTH] Creating workspace for existing user");
              await prisma.workspace.create({
                data: {
                  owner_id: existingUser.id,
                  description: `${existingUser.username}'s workspace`,
                  status: "active",
                },
              });
            }
            
            // Update the user object with the database ID
            user.id = existingUser.id.toString();
          } else {
            console.log(`[AUTH] Creating new ${account.provider} user:`, user.email);
            
            const newUserData: any = {
              email: user.email!,
              username: user.name || user.email!.split("@")[0],
              image: user.image,
              emailVerified: new Date(),
            };
            
            if (account.provider === "google") {
              newUserData.googleId = account.providerAccountId;
            } else if (account.provider === "github") {
              newUserData.githubId = account.providerAccountId;
            }
            
            // Créer un nouvel utilisateur avec OAuth
            const newUser = await prisma.user.create({
              data: newUserData,
            });

            console.log("[AUTH] New user created:", newUser.id);

            // Créer un workspace par défaut pour le nouvel utilisateur
            const workspace = await prisma.workspace.create({
              data: {
                owner_id: newUser.id,
                description: `${newUser.username}'s workspace`,
                status: "active",
              },
            });
            
            console.log("[AUTH] Workspace created:", workspace.id);
            
            // Update the user object with the new database ID
            user.id = newUser.id.toString();
          }
        }
      } catch (error) {
        console.error("[AUTH] Error in signIn callback:", error);
        throw error;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id.toString();
        console.log("[AUTH] Database session - user.id:", user.id);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};
