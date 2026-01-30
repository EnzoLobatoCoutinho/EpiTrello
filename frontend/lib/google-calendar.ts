/*
** EPITECH PROJECT, 2025
** EpiTrello
** File description:
** Google Calendar integration
*/

import { google } from 'googleapis';
import prisma from '@/lib/prisma';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/google-calendar/callback`
);

/**
 * Get OAuth2 client for a user
 */
export async function getCalendarClient(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleCalendarToken: true, googleCalendarRefresh: true }
  });

  if (!user?.googleCalendarToken) {
    throw new Error('User not connected to Google Calendar');
  }

  oauth2Client.setCredentials({
    access_token: user.googleCalendarToken,
    refresh_token: user.googleCalendarRefresh || undefined,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Create event in Google Calendar
 */
export async function createCalendarEvent(
  userId: number,
  card: {
    title: string;
    description: string;
    start_date: Date;
    due_date: Date;
  }
) {
  try {
    const calendar = await getCalendarClient(userId);

    const event = {
      summary: card.title,
      description: card.description,
      start: {
        dateTime: card.start_date.toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: card.due_date.toISOString(),
        timeZone: 'Europe/Paris',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email' as const, minutes: 24 * 60 },
          { method: 'popup' as const, minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data.id || null;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}

/**
 * Update event in Google Calendar
 */
export async function updateCalendarEvent(
  userId: number,
  eventId: string,
  card: {
    title: string;
    description: string;
    start_date: Date;
    due_date: Date;
  }
) {
  try {
    const calendar = await getCalendarClient(userId);

    const event = {
      summary: card.title,
      description: card.description,
      start: {
        dateTime: card.start_date.toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: card.due_date.toISOString(),
        timeZone: 'Europe/Paris',
      },
    };

    await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
    });
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw error;
  }
}

/**
 * Delete event from Google Calendar
 */
export async function deleteCalendarEvent(userId: number, eventId: string) {
  try {
    const calendar = await getCalendarClient(userId);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
}

/**
 * Generate OAuth URL for calendar access
 */
export function getCalendarAuthUrl() {
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
}

/**
 * Exchange auth code for tokens
 */
export async function exchangeCalendarCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  return {
    access_token: tokens.access_token || null,
    refresh_token: tokens.refresh_token || null,
  };
}
