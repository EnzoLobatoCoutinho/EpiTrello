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
  { params }: { params: Promise<{ boardId: string; listId: string }> }
) {
  try {
    const resolvedParams = await params
    const userId = getUserIdFromReq(req)
    
    console.log("🔍 PUT /api/dashboard/board/[boardId]/lists/[listId]")
    console.log("UserId:", userId)
    console.log("Params:", resolvedParams)
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const listId = Number(resolvedParams.listId)
    if (Number.isNaN(listId)) {
      return NextResponse.json({ error: "Invalid list id" }, { status: 400 })
    }

    const body = await req.json()
    console.log("Body reçu:", body)

    // Vérifier que la liste existe
    const existingList = await prisma.list.findUnique({
      where: { id: listId },
      select: { 
        id: true, 
        board_id: true,
        title: true,
        position: true
      }
    })

    console.log("Liste trouvée:", existingList)

    if (!existingList) {
      return NextResponse.json({ error: "List not found" }, { status: 404 })
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    
    if (body.title !== undefined) {
      updateData.title = String(body.title).slice(0, 255)
    }
    
    if (body.position !== undefined) {
      updateData.position = Number(body.position)
    }

    console.log("Données de mise à jour:", updateData)

    // Mettre à jour la liste
    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: updateData,
      select: {
        id: true,
        title: true,
        position: true,
        board_id: true
      }
    })

    console.log("✅ Liste mise à jour avec succès:", updatedList)
    return NextResponse.json(updatedList)
    
  } catch (error) {
    console.error("❌ Erreur complète:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A")
    
    if (error && typeof error === 'object' && 'code' in error) {
      console.error("Code d'erreur Prisma:", (error as any).code)
      console.error("Meta:", (error as any).meta)
    }
    
    return NextResponse.json({ 
      error: "Failed to update list", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}