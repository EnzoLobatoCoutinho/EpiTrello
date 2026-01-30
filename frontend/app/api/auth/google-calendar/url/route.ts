/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** Get Google Calendar OAuth URL
*/

import { NextResponse } from 'next/server';
import { getCalendarAuthUrl } from '@/lib/google-calendar';
import { getUserIdFromRequest } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = getCalendarAuthUrl();
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating calendar auth URL:', error);
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
  }
}
