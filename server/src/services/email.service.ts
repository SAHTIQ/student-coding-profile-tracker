import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });

  /**
   * Sends welcome email or sync report to @bitsathy.ac.in user
   */
  static async sendNotification(toEmail: string, subject: string, htmlContent: string) {
    if (!toEmail.endsWith('@bitsathy.ac.in')) {
      console.warn(`[EmailService] Skipped sending to non-institutional email: ${toEmail}`);
      return;
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`📧 [Simulated Email to ${toEmail}]: Subject: "${subject}"`);
      return;
    }

    try {
      await EmailService.transporter.sendMail({
        from: '"CodePulse Institutional System" <noreply@bitsathy.ac.in>',
        to: toEmail,
        subject,
        html: htmlContent,
      });
      console.log(`✅ [EmailService] Notification sent to ${toEmail}`);
    } catch (err: any) {
      console.error(`❌ [EmailService] Error sending to ${toEmail}:`, err.message);
    }
  }
}
