import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser, userHasWorkspaceRole } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
  const me = await getCurrentUser(req)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspaceId = Number(params.workspaceId)
  if (Number.isNaN(workspaceId)) {
    return NextResponse.json({ error: 'Invalid workspace id' }, { status: 400 })
  }

  const allowed = await userHasWorkspaceRole(me.id, workspaceId, ['OWNER', 'ADMIN', 'MEMBER'])
  if (!allowed) return NextResponse.json({ error: 'Non autorisés' }, { status: 403 })

  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspace_id: workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    })

    const payload = members.map((member) => ({
      id: member.id,
      role: member.role,
      user: member.user,
      workspace_id: member.workspace_id,
      created_at: member.created_at,
    }))
    return NextResponse.json({ members: payload })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { workspaceId: string } }) {
  const me = await getCurrentUser(req)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const workspaceId = Number(params.workspaceId)
  const allowed = await userHasWorkspaceRole(me.id, workspaceId, ['OWNER', 'ADMIN'])
  if (!allowed) return NextResponse.json({ error: 'Droits non autorisés' }, { status: 403 })

  const body = await req.json()
  let { userId, email, role } = body as { userId?: number; email?: string; role?: string }
  email = email?.toLowerCase()
  if (!userId && !email) return NextResponse.json({ error: 'Missing fields: provide userId or email' }, { status: 400 })
  if (!role) return NextResponse.json({ error: 'Missing role' }, { status: 400 })
  if (!['OWNER', 'ADMIN', 'MEMBER'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  try {
    let user
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: Number(userId) } })
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } })
    }
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    const existing = await prisma.workspaceMember.findUnique({ where: { user_id_workspace_id: { user_id: Number(user.id), workspace_id: workspaceId } } })
    if (existing) return NextResponse.json({ error: 'Déja membre' }, { status: 409 })

  const member = await prisma.workspaceMember.create({ data: { user_id: Number(user.id), workspace_id: workspaceId, role: role as any } })
    return NextResponse.json({ member, user: { id: user.id, email: user.email, username: user.username } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}



export async function PATCH(req: Request, { params }: { params: { workspaceId: string } }) {
  const me = await getCurrentUser(req)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const workspaceId = Number(params.workspaceId)
  const allowed = await userHasWorkspaceRole(me.id, workspaceId, ['OWNER', 'ADMIN'])
  if (!allowed) return NextResponse.json({ error: 'Droits non autorisés' }, { status: 403 })

  const { memberId, role } = await req.json()
  if (!memberId || !role) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  if (!['OWNER', 'ADMIN', 'MEMBER'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  try {
    const member = await prisma.workspaceMember.update({ where: { id: Number(memberId) }, data: { role } })
    return NextResponse.json({ member })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { workspaceId: string } }) {
  const me = await getCurrentUser(req)
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const workspaceId = Number(params.workspaceId)
  const allowed = await userHasWorkspaceRole(me.id, workspaceId, ['OWNER', 'ADMIN'])
  if (!allowed) return NextResponse.json({ error: 'Droits non autorisés' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'Manque memberId' }, { status: 400 })

  try {
    await prisma.workspaceMember.delete({ where: { id: Number(memberId) } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
