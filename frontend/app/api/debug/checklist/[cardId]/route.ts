import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const id = Number(cardId);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid card id" }, { status: 400 });

    const items = await prisma.checklistItem.findMany({ where: { card_id: id }, orderBy: { position: "asc" } });
    return NextResponse.json(items);
  } catch (e) {
    console.error("Debug checklist GET error:", e);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
