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

async function assertWorkspaceMember(boardId: number, userId: number) {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      workspace: {
        OR: [
          { owner_id: userId },
          { members: { some: { user_id: userId } } },
        ],
      },
    },
    select: { workspace_id: true },
  })
  return board
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const boardId = Number(params.id)
  if (Number.isNaN(boardId)) return NextResponse.json({ error: "Invalid board id" }, { status: 400 })

  const board = await assertWorkspaceMember(boardId, Number(userId))
  if (!board) return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 })

  const labels = await prisma.label.findMany({
    where: { board_id: boardId },
    orderBy: { id: "asc" },
  })

  return NextResponse.json({ labels })
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const boardId = Number(params.id)
  if (Number.isNaN(boardId)) return NextResponse.json({ error: "Invalid board id" }, { status: 400 })

  const board = await assertWorkspaceMember(boardId, Number(userId))
  if (!board) return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const color = typeof body.color === "string" ? body.color.trim() : ""

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })
  if (!color) return NextResponse.json({ error: "Color is required" }, { status: 400 })

  const label = await prisma.label.create({
    data: {
      board_id: boardId,
      name: name.slice(0, 50),
      color: color.slice(0, 20),
    },
  })

  return NextResponse.json({ label }, { status: 201 })
}

