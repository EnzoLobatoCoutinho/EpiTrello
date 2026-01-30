/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** Check user's Google Calendar connection status
*/

import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarToken: true }
    });

    return NextResponse.json({
      connected: !!user?.googleCalendarToken
    });
  } catch (error) {
    console.error('Error checking calendar status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
