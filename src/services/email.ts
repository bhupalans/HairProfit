'use server';

import mail from '@sendgrid/mail';

interface EmailPayload {
    subject: string;
    html: string;
}

/**
 * Sends an email notification. This is a fire-and-forget operation from the user's perspective.
 * If email fails, we log it but don't block the user's main action (like downloading a PDF).
 */
export async function sendNotification({ subject, html }: EmailPayload) {
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL;
    const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;

    // Check for environment variables every time the function is called
    if (!SENDGRID_API_KEY || !NOTIFICATION_EMAIL || !FROM_EMAIL) {
        const missing = [
            !SENDGRID_API_KEY && "SENDGRID_API_KEY",
            !NOTIFICATION_EMAIL && "NOTIFICATION_EMAIL",
            !FROM_EMAIL && "SENDGRID_FROM_EMAIL"
        ].filter(Boolean).join(', ');
        
        console.warn(`Email notification not sent. The following environment variables are missing in your .env file: ${missing}. This is a server-side log.`);
        return;
    }

    // Set the API key every time to ensure it's loaded correctly
    mail.setApiKey(SENDGRID_API_KEY);

    const msg = {
        to: NOTIFICATION_EMAIL,
        from: {
          email: FROM_EMAIL,
          name: 'HairProfit Notifier'
        },
        subject,
        html,
        text: html.replace(/<[^>]*>?/gm, ''), // Simple conversion of HTML to text
    };

    try {
        console.log(`Attempting to send notification email to ${NOTIFICATION_EMAIL}... This is a server-side log.`);
        await mail.send(msg);
        console.log(`Notification email sent successfully. Check your inbox/spam folder. This is a server-side log.`);
    } catch (error: any) {
        console.error('SERVER-SIDE ERROR: Error sending notification email via SendGrid:', error);
        if (error.response) {
            console.error('SendGrid Response Body:', error.response.body);
        }
    }
}
