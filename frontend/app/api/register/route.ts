import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS ?? 10))
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashed, username: username?.trim() || null },
      select: { id: true, email: true, username: true },
    })

    return NextResponse.json({ message: `Bienvenue ${user.username}!`, user }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
