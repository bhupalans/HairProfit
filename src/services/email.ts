'use server';

import mail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

if (SENDGRID_API_KEY) {
  mail.setApiKey(SENDGRID_API_KEY);
}

interface EmailPayload {
    subject: string;
    html: string;
}

/**
 * Sends an email notification. This is a fire-and-forget operation from the user's perspective.
 * If email fails, we log it but don't block the user's main action (like downloading a PDF).
 */
export async function sendNotification({ subject, html }: EmailPayload) {
    if (!SENDGRID_API_KEY || !NOTIFICATION_EMAIL || !FROM_EMAIL) {
        const missing = [
            !SENDGRID_API_KEY && "SENDGRID_API_KEY",
            !NOTIFICATION_EMAIL && "NOTIFICATION_EMAIL",
            !FROM_EMAIL && "SENDGRID_FROM_EMAIL"
        ].filter(Boolean).join(', ');
        
        console.warn(`Email notification not sent because the following environment variables are not configured: ${missing}.`);
        return; // Don't throw an error to the client.
    }

    const msg = {
        to: NOTIFICATION_EMAIL,
        from: FROM_EMAIL,
        subject,
        html,
        text: html.replace(/<[^>]*>?/gm, ''), // Simple conversion of HTML to text for the text part of the email
    };

    try {
        await mail.send(msg);
        console.log(`Notification email sent successfully to ${NOTIFICATION_EMAIL}`);
    } catch (error: any) {
        console.error('Error sending notification email via SendGrid:', error);
        if (error.response) {
            console.error(error.response.body);
        }
    }
}
