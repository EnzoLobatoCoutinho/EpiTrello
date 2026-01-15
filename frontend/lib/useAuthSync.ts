/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** useAuthSync hook to sync authentication tokens
*/

"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * Hook to sync authentication tokens after NextAuth login
 * Generates a valid JWT token for API requests
 */
export function useAuthSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      console.log("[useAuthSync] Session authenticated, syncing token for:", session.user.email);
      
      // Call the sync-token endpoint to get a valid JWT
      fetch("/api/auth/sync-token", { method: "POST" })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.token) {
              // Store the token in localStorage for API requests
              localStorage.setItem("token", data.token);
              console.log("[useAuthSync] Token synced and stored in localStorage");
            }
          } else {
            console.error("[useAuthSync] Failed to sync token, status:", res.status);
          }
        })
        .catch((error) => {
          console.error("[useAuthSync] Error syncing token:", error);
        });
    }
  }, [status, session?.user?.email]);
}
