/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** Google Calendar OAuth callback
*/

import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth-utils';
import { exchangeCalendarCode } from '@/lib/google-calendar';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(new URL('/dashboard?error=no_code', req.url));
    }

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const { access_token, refresh_token } = await exchangeCalendarCode(code);

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleCalendarToken: access_token,
        googleCalendarRefresh: refresh_token,
      },
    });

    return NextResponse.redirect(new URL('/dashboard?calendar_connected=true', req.url));
  } catch (error) {
    console.error('Calendar OAuth error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=calendar_auth_failed', req.url));
  }
}
