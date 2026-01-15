/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello - Microservice Socket
 ** Run on port 4000
 */

import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";

const PORT = 4000;
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URLS = (process.env.FRONTEND_URLS || "http://localhost:3000").split(",").map(url => url.trim());
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

async function startServer() {
  const httpServer = createServer();

  const corsOptions = NODE_ENV === "development" ? { origin: "*", methods: ["GET", "POST"] } : { 
    origin: FRONTEND_URLS,
    methods: ["GET", "POST"],
    credentials: true,
  };

  const io = new Server(httpServer, {
    cors: corsOptions,
  });

  const subClient = createClient({ url: REDIS_URL });

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
