import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import jwt from "jsonwebtoken"

function getUserIdFromReq(req: Request) {
  const auth = req.headers.get("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) return null
  try {
    const secret = process.env.JWT_SECRET || "dev_secret"
    const payload: any = jwt.verify(token, secret)
    return payload?.id ?? null
  } catch {
    return null
  }
}

export async function POST(req: Request, context: { params: { id: string } }) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const params = await context.params
  const boardId = Number(params.id)
  
  if (Number.isNaN(boardId)) {
    return NextResponse.json({ error: "Invalid board id" }, { status: 400 })
  }
  const board = await prisma.board.findFirst({
    where: { 
      id: boardId,
      workspace: {
        OR: [
          { owner_id: Number(userId) },
          { members: { some: { user_id: Number(userId) } } },
        ],
      },
    },
  })
  
  if (!board) {
    return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 })
  }
  
  try {
    const body = await req.json()
    const { name, color } = body

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }
    const newLabel = await prisma.label.create({
      data: {
        board_id: boardId,
        name,
        color,
      },
    })
    console.log("Label created successfully for board", boardId, ":", newLabel)
    return NextResponse.json(newLabel, { status: 201 })
  } catch (error) {
    console.error("Error creating label:", error)
    return NextResponse.json({ error: "Failed to create label" }, { status: 500 })
  }
}