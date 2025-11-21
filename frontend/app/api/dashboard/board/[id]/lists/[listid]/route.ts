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

export async function PUT(req: Request, context: { params: { id: string; listid: string } }) {
  const userId = getUserIdFromReq(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const params = await context.params
  const boardId = Number(params.id)
  const listId = Number(params.listid)
  
  if (Number.isNaN(boardId) || Number.isNaN(listId)) {
    return NextResponse.json({ error: "Invalid board or list id" }, { status: 400 })
  }
  
  const list = await prisma.list.findFirst({
    where: { 
      id: listId,
      board_id: boardId,
      board: {
        workspace: {
          OR: [
            { owner_id: Number(userId) },
            { members: { some: { user_id: Number(userId) } } },
          ],
        },
      },
    },
  })
  
  if (!list) {
    return NextResponse.json({ error: "List not found or access denied" }, { status: 404 })
  }
  
  try {
    const body = await req.json()
    const { title, position } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (position !== undefined) updateData.position = position

    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: updateData,
    })
    console.log("List updated successfully for board", boardId, ":", updatedList)

    return NextResponse.json(updatedList)
  } catch (error) {
    console.error("Error updating list:", error)
    return NextResponse.json({ error: "Failed to update list" }, { status: 500 })
  }
}