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

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const listId = Number(context.params.id)
  if (Number.isNaN(listId)) return NextResponse.json({ error: "Invalid list id" }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const title = body.title ? String(body.title).slice(0, 255) : null
  if (!title) return NextResponse.json({ error: "No title provided" }, { status: 400 })
  const list = await prisma.list.findFirst({ where: { id: listId }, include: { board: { include: { workspace: true } } } })
  if (!list || list.board.workspace.owner_id !== Number(userId)) {
    return NextResponse.json({ error: "Not found or access denied" }, { status: 404 })
  }

  const updated = await prisma.list.update({ where: { id: listId }, data: { title } })
  return NextResponse.json(updated)
}
