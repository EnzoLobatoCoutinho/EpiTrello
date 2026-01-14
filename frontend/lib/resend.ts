/*
 ** EPITECH PROJECT, 2025
 ** EpiTrello
 ** File description:
 ** Resend email service
 */

import { Resend } from "resend";

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email invitation when a user is added to a board
 */
export async function sendBoardInvitationEmail(
  recipientEmail: string,
  recipientName: string,
  boardName: string,
  inviterName: string,
  boardUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "EpiTrello <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `Vous avez été ajouté au board "${boardName}"`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invitation au Board</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">EpiTrello</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #667eea; margin-top: 0;">Bonjour ${recipientName} 👋</h2>
              
              <p style="font-size: 16px; margin: 20px 0;">
                <strong>${inviterName}</strong> vous a ajouté au board <strong>"${boardName}"</strong> !
              </p>
              
              <p style="font-size: 14px; color: #666; margin: 20px 0;">
                Vous pouvez maintenant collaborer sur ce board, créer et modifier des cartes, et suivre l'avancement du projet.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${boardUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold; 
                          display: inline-block;
                          font-size: 16px;">
                  Accéder au Board
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                <a href="${boardUrl}" style="color: #667eea; word-break: break-all;">${boardUrl}</a>
              </p>
              
              <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
                © ${new Date().getFullYear()} EpiTrello. Tous droits réservés.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Bonjour ${recipientName},

${inviterName} vous a ajouté au board "${boardName}" !

Vous pouvez maintenant collaborer sur ce board, créer et modifier des cartes, et suivre l'avancement du projet.

Accéder au board : ${boardUrl}

© ${new Date().getFullYear()} EpiTrello
      `.trim(),
    });

    if (error) {
      console.error("Resend email error:", error);
      return { success: false, error };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
