/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello - Microservice Socket
 ** Run on port 4000
 */

import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";

const PORT = 4000;
const FRONTEND_URL = "http://localhost:3000";

async function startServer() {
  const httpServer = createServer();

  const io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  const redisUrl = "redis://localhost:6379";
  const subClient = createClient({ url: redisUrl });

  subClient.on("error", (err) => console.error("Redis Client Error", err));

  try {
    await subClient.connect();
    console.log("OK à Redis");

    await subClient.subscribe("board-events", (message) => {
      try {
        const { boardId, event, data } = JSON.parse(message);
        console.log(`Diffusion -> board-${boardId}: ${event}`);

        io.to(`board-${boardId}`).emit(event, data);
      } catch (e) {
        console.error("Erreur de format JSON", e);
      }
    });
  } catch (e) {
    console.error("Impossible de se connecter à Redis. Vérifie Docker.", e);
  }

  io.on("connection", (socket) => {
    console.log(`Client connecté: ${socket.id}`);

    socket.on("join-board", (boardId) => {
      socket.join(`board-${boardId}`);
      console.log(`Socket ${socket.id} a rejoint la room board-${boardId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Client déconnecté: ${socket.id}`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`Serveur Socket prêt sur http://localhost:${PORT}`);
  });
}

startServer();
