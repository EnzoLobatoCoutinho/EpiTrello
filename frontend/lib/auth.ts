import jwt from 'jsonwebtoken'
import prisma from './prisma'

export function getTokenFromReq(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  return token
}

export async function getCurrentUser(req: Request) {
  const token = getTokenFromReq(req)
  if (!token) return null
  try {
    const secret = process.env.JWT_SECRET || 'dev_secret'
    const payload: any = jwt.verify(token, secret)
    const user = await prisma.user.findUnique({ where: { id: Number(payload.id) } })
    return user as any
  } catch (err) {
    return null
  }
}

export async function userHasWorkspaceRole(userId: number, workspaceId: number, roles: Array<'OWNER' | 'ADMIN' | 'MEMBER'>) {
  if (!prisma || !('workspaceMember' in prisma)) {
    throw new Error(
      "Prisma client missing model 'WorkspaceMember'. Regenerate the client with `npx prisma generate` and restart the server."
    )
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: { user_id_workspace_id: { user_id: userId, workspace_id: workspaceId } },
    select: { role: true },
  })
  if (membership && roles.includes(membership.role as any)) {
    return true
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { owner_id: true },
  })

  if (workspace?.owner_id === userId) {
    if (!membership) {
      await prisma.workspaceMember.upsert({
        where: { user_id_workspace_id: { user_id: userId, workspace_id: workspaceId } },
        update: {},
        create: { user_id: userId, workspace_id: workspaceId, role: 'OWNER' },
      }).catch(() => {})
    }
    return roles.includes('OWNER')
  }

  return false
}
