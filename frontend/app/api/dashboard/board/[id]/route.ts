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

export async function GET(req: Request, context?: { params?: Promise<{ id?: string }> }) {
    const userId = getUserIdFromReq(req)
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const params = await context?.params
    const paramId = params?.id ?? (() => {
        try {
            const url = new URL(req.url)
            const parts = url.pathname.split("/").filter(Boolean)
            return parts.length ? parts[parts.length - 1] : null
        } catch {
            return null
        }
    })()

    const boardId = Number(paramId)
    if (!paramId || Number.isNaN(boardId)) {
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
        include: {
            lists: { include: { cards: true }, orderBy: { position: "asc" } },
            labels: true,
        },
    })
    if (!board) {
        return NextResponse.json({ error: "Board not found or access denied" }, { status: 404 })
    }
    const lists = (board.lists || []).map((l) => ({
        id: String(l.id),
        title: l.title,
        cards: (l.cards || []).map((c) => ({ id: String(c.id), title: c.title, description: c.description })),
    }))

    const totalCards = lists.reduce((acc, l) => acc + l.cards.length, 0)
    const colorClasses = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-red-500"]
    const color = colorClasses[boardId % colorClasses.length]
    const boardsData = {
        [String(board.id)]: { name: board.title, color, tasks: totalCards, workspaceId: board.workspace_id },
    }

    const boardPayload = {
        id: board.id,
        title: board.title,
        color,
        workspace_id: board.workspace_id,
    }

    const labels = (board.labels || []).map((label) => ({
        id: label.id,
        board_id: label.board_id,
        name: label.name,
        color: label.color,
    }))

    return NextResponse.json({ board: boardPayload, boardsData, lists, labels })
}