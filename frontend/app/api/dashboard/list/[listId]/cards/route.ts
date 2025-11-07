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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const resolvedParams = await params
    const userId = getUserIdFromReq(req)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const listId = Number(resolvedParams.listId)
    if (Number.isNaN(listId)) {
      return NextResponse.json({ error: "Invalid list id" }, { status: 400 })
    }

    const body = await req.json()
    const title = body.title ? String(body.title).slice(0, 255) : null
    const description = body.description ? String(body.description).slice(0, 1000) : ""

    if (!title) {
      return NextResponse.json({ error: "No title provided" }, { status: 400 })
    }
    const list = await prisma.list.findFirst({
      where: { id: listId },
      include: { board: { include: { workspace: true } } },
    })

    if (!list || list.board.workspace.owner_id !== Number(userId)) {
      return NextResponse.json({ error: "List not found or access denied" }, { status: 404 })
    }
    let label = await prisma.label.findFirst({ where: { board_id: list.board_id } })
    if (!label) {
      label = await prisma.label.create({
        data: {
          board_id: list.board_id,
          name: "Default",
          color: "#6B7280",
        },
      })
    }
    const cardsCount = await prisma.card.count({ where: { list_id: listId } })

    const now = new Date()
    const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 jours
    const card = await prisma.card.create({
      data: {
        list_id: listId,
        label_id: label.id,
        title,
        description,
        start_date: now,
        due_date: due,
        position: cardsCount,
      },
    })

    return NextResponse.json(card)
  } catch (error) {
    console.error("Error creating card:", error)
    return NextResponse.json(
      {
        error: "Failed to create card",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}