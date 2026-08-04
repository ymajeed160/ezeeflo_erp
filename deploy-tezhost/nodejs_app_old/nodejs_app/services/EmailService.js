'use strict';

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  /**
   * Create a nodemailer transporter from email settings
   */
  static createTransporter(settings) {
    return nodemailer.createTransport({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort, 10) || 587,
      secure: settings.useSsl === true || settings.useSsl === 'true',
      auth: {
        user: settings.username || settings.senderEmail,
        pass: settings.password,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certs for testing
        ...(settings.useTls ? { ciphers: 'SSLv3' } : {}),
      },
    });
  }

  /**
   * Send a welcome email to a newly created user
   * @param {Object} settings - Email settings from DB
   * @param {Object} params - { to, name, username, tempPassword, portalUrl }
   * @returns {Promise<Object>} { success, message }
   */
  static async sendWelcomeEmail(settings, { to, name, username, tempPassword, portalUrl }) {
    const transporter = this.createTransporter(settings);

    const mailOptions = {
      from: `"${settings.senderName || 'ERP MT Suite'}" <${settings.senderEmail}>`,
      to,
      subject: `Welcome to ERP MT Suite — Your Account Details`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 20px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Welcome to ERP MT Suite</h1>
                    <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">Your account has been created</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr><td style="padding:32px 40px;">
                  <p style="font-size:15px;color:#334155;margin:0 0 20px;">Hello <strong>${name}</strong>,</p>
                  <p style="font-size:14px;color:#475569;margin:0 0 24px;line-height:1.6;">
                    An account has been created for you on the ERP MT Suite portal.
                    Please use the credentials below to sign in and set up your password.
                  </p>

                  <!-- Credentials Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:24px;">
                    <tr><td style="padding:20px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:6px 0;font-size:13px;color:#64748b;width:110px;">Portal URL</td>
                          <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">
                            <a href="${portalUrl}" style="color:#2563eb;text-decoration:none;">${portalUrl}</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;font-size:13px;color:#64748b;">Username</td>
                          <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;font-family:monospace;">${username}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;font-size:13px;color:#64748b;">Temporary Password</td>
                          <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;font-family:monospace;">${tempPassword}</td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td align="center" style="padding:0 0 24px;">
                      <a href="${portalUrl}/login"
                         style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 36px;border-radius:6px;font-size:14px;font-weight:600;">
                        Sign In to Portal
                      </a>
                    </td></tr>
                  </table>

                  <div style="background:#fef2f2;border-radius:6px;border:1px solid #fecaca;padding:14px 16px;margin-bottom:20px;">
                    <p style="margin:0;font-size:13px;color:#991b1b;font-weight:600;">⚠️ Security Notice</p>
                    <p style="margin:6px 0 0;font-size:12px;color:#b91c1c;line-height:1.5;">
                      For security reasons, please change your password immediately after your first login.
                      This temporary password will expire in 7 days.
                    </p>
                  </div>
                </td></tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                      ERP MT Suite — Multi-Tenant ERP System<br>
                      This is an automated message. Please do not reply directly.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info(`Welcome email sent to ${to}: ${info.messageId}`);
      return { success: true, message: `Welcome email sent to ${to}` };
    } catch (error) {
      logger.error('Welcome email failed:', { error: error.message, to });
      // Don't throw — welcome email failure should not break user creation
      return { success: false, message: error.message };
    }
  }

  /**
   * Send a test email to verify SMTP configuration
   * @param {Object} settings - Email settings from DB
   * @param {string} recipientEmail - Email to send the test to
   * @returns {Promise<Object>} { success, message, info? }
   */
  static async sendTestEmail(settings, recipientEmail) {
    const transporter = this.createTransporter(settings);

    const mailOptions = {
      from: `"${settings.senderName || 'ERP MT Suite'}" <${settings.senderEmail}>`,
      to: recipientEmail,
      subject: 'ERP MT Suite — Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #2563eb;">✅ SMTP Configuration Test</h2>
          <p>Your email settings are working correctly!</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0;" />
          <table style="font-size: 13px; color: #475569;">
            <tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">SMTP Host:</td><td>${settings.smtpHost}</td></tr>
            <tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">SMTP Port:</td><td>${settings.smtpPort}</td></tr>
            <tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">Sender:</td><td>${settings.senderEmail}</td></tr>
            <tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">SSL:</td><td>${settings.useSsl ? 'Yes' : 'No'}</td></tr>
            <tr><td style="padding: 4px 8px 4px 0; font-weight: 600;">TLS:</td><td>${settings.useTls ? 'Yes' : 'No'}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #94a3b8;">Sent at ${new Date().toLocaleString()}</p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info(`Test email sent successfully to ${recipientEmail}: ${info.messageId}`);
      return { success: true, message: `Test email sent to ${recipientEmail}`, info };
    } catch (error) {
      logger.error('Test email failed:', { error: error.message, code: error.code });

      let userMessage;
      if (error.code === 'EAUTH') {
        userMessage = `Email authentication failed. For Gmail:
1. Go to https://myaccount.google.com/security → Enable 2-Step Verification
2. Go to https://myaccount.google.com/apppasswords → Generate an "App Password"
3. Use that 16-character App Password in the Password field (not your regular Gmail password)`;
      } else if (error.code === 'ESOCKET' || error.code === 'ECONNECTION') {
        userMessage = `Cannot connect to SMTP server at ${settings.smtpHost}:${settings.smtpPort}. Check host/port and firewall settings.`;
      } else {
        userMessage = error.message;
      }
      throw new Error(userMessage);
    }
  }
  /**
   * Send an invoice via email with PDF attachment
   * @param {Object} settings - Email settings from DB
   * @param {Object} params - { to, subject, body, pdfBase64, invoiceNumber, customerName }
   * @returns {Promise<Object>} { success, message }
   */
  static async sendInvoiceEmail(settings, { to, subject, body, pdfBase64, invoiceNumber, customerName }) {
    const transporter = this.createTransporter(settings);

    // Decode base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Convert plain text newlines to HTML <br> tags
    const htmlBody = body
      ? body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')
      : null;

    const mailOptions = {
      from: `"${settings.senderName || 'EzeeFlo ERP'}" <${settings.senderEmail}>`,
      to,
      subject: subject || `Invoice #${invoiceNumber} from ${settings.senderName || 'EzeeFlo ERP'}`,
      html: htmlBody ? `<p>${htmlBody}</p>` : `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #2563eb;">Invoice #${invoiceNumber}</h2>
          <p>Dear ${customerName || 'Valued Customer'},</p>
          <p>Please find attached invoice <strong>#${invoiceNumber}</strong> for your reference.</p>
          <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #94a3b8;">
            This is an automated email from ${settings.senderName || 'EzeeFlo ERP'}.<br/>
            Thank you for your business!
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info(`Invoice email sent to ${to}: ${info.messageId}`);
      return { success: true, message: `Invoice sent to ${to}` };
    } catch (error) {
      logger.error('Invoice email failed:', { error: error.message, to });
      throw new Error(error.message);
    }
  }
}

module.exports = EmailService;
