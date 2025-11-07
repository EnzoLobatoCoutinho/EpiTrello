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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ listId: string; cardId: string }> }
) {
  try {
    const resolvedParams = await params
    const userId = getUserIdFromReq(req)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cardId = Number(resolvedParams.cardId)
    if (Number.isNaN(cardId)) {
      return NextResponse.json({ error: "Invalid card id" }, { status: 400 })
    }

    const body = await req.json()

    const existingCard = await prisma.card.findUnique({
      where: { id: cardId }
    })

    if (!existingCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    const updateData: any = {}
    
    if (body.title !== undefined) {
      updateData.title = String(body.title).slice(0, 255)
    }
    
    if (body.description !== undefined) {
      updateData.description = String(body.description)
    }
    
    if (body.label_id !== undefined) {
      updateData.label_id = body.label_id === null ? null : Number(body.label_id)
    }
    
    if (body.start_date !== undefined) {
      updateData.start_date = body.start_date ? new Date(body.start_date) : new Date()
    }
    
    if (body.due_date !== undefined) {
      updateData.due_date = body.due_date ? new Date(body.due_date) : new Date()
    }
    
    if (body.list_id !== undefined) {
      updateData.list_id = Number(body.list_id)
    }

    // Ajouter la gestion de position
    if (body.position !== undefined) {
      updateData.position = Number(body.position)
    }

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: updateData
    })

    return NextResponse.json(updatedCard)
    
  } catch (error) {
    console.error("❌ Erreur:", error)
    return NextResponse.json({ 
      error: "Failed to update card", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}