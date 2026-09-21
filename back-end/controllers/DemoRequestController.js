'use strict';

const { EmailSetting } = require('../models');
const EmailService = require('../services/EmailService');
const logger = require('../utils/logger');

/**
 * DemoRequestController — Handles public demo request form submissions.
 * No authentication required — this is a public endpoint.
 */
class DemoRequestController {

  /**
   * POST /api/demo-request
   * Accepts demo form data and emails it to the sales team.
   */
  async submitRequest(req, res, next) {
    try {
      const {
        fullName,
        companyName,
        businessEmail,
        phoneNumber,
        country,
        industry,
        companySize,
        interestedModules,
        preferredDate,
        preferredTime,
        message,
      } = req.body;

      // ── Validate required fields ──
      if (!fullName || !companyName || !businessEmail || !phoneNumber ||
          !country || !industry || !companySize || !preferredDate || !preferredTime) {
        return res.status(400).json({
          success: false,
          message: 'All required fields must be filled.',
        });
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
        });
      }

      // ── Load SMTP settings from DB ──
      // Use the default tenant's email settings (no-reply@ezeeflo.com)
      const defaultTenantId = '11111111-1111-1111-1111-111111111111';
      let emailSettings = await EmailSetting.findOne({ where: { tenantId: defaultTenantId } });

      // Fallback to hardcoded defaults if not found in DB
      if (!emailSettings || !emailSettings.smtpHost) {
        logger.warn('Email settings not found in DB, using hardcoded defaults for demo request');
        emailSettings = {
          smtpHost: 'mail.ezeeflo.com',
          smtpPort: 465,
          senderEmail: 'no-reply@ezeeflo.com',
          senderName: 'EzeeFlo Demo Requests',
          username: 'no-reply@ezeeflo.com',
          password: 'Memits@396',
          useSsl: true,
          useTls: true,
        };
      }

      // ── Build email content ──
      const modulesList = Array.isArray(interestedModules) && interestedModules.length > 0
        ? interestedModules.map(m => `<li>${m}</li>`).join('')
        : '<li>Not specified</li>';

      const mailOptions = {
        from: `"${emailSettings.senderName || 'EzeeFlo Demo'}" <${emailSettings.senderEmail}>`,
        to: 'ymajeed160@gmail.com',
        subject: `🔔 New Demo Request — ${fullName} from ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
              <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 40px;text-align:center;">
                      <h2 style="color:#fff;margin:0;font-size:20px;font-weight:700;">New Demo Request</h2>
                      <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px;">Someone wants to see EzeeFlo in action</p>
                    </td>
                  </tr>
                  <tr><td style="padding:28px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr><td colspan="2" style="padding:0 0 16px;"><h3 style="margin:0;font-size:15px;color:#1e293b;">Contact Information</h3></td></tr>
                      ${row('Full Name', fullName)}
                      ${row('Company', companyName)}
                      ${row('Business Email', businessEmail)}
                      ${row('Phone', phoneNumber)}
                      ${row('Country', country)}
                      ${row('Industry', industry)}
                      ${row('Company Size', companySize)}
                      ${row('Preferred Date', preferredDate)}
                      ${row('Preferred Time', preferredTime)}
                      <tr><td colspan="2" style="padding:16px 0 8px;"><h3 style="margin:0;font-size:15px;color:#1e293b;">Interested Modules</h3></td></tr>
                      <tr>
                        <td colspan="2" style="padding:8px 0 0;">
                          <ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#475569;line-height:1.8;">${modulesList}</ul>
                        </td>
                      </tr>
                      ${message ? `<tr><td colspan="2" style="padding:16px 0 8px;"><h3 style="margin:0;font-size:15px;color:#1e293b;">Message</h3></td></tr>
                      <tr><td colspan="2" style="padding:8px 12px;background:#f8fafc;border-radius:6px;font-size:13px;color:#475569;line-height:1.6;">${message.replace(/\n/g, '<br>')}</td></tr>` : ''}
                    </table>
                    <div style="margin-top:24px;padding:14px 16px;background:#eef2ff;border-radius:8px;border:1px solid #c7d2fe;">
                      <p style="margin:0;font-size:12px;color:#4338ca;">
                        📧 Reply directly to this email or contact <strong>${businessEmail}</strong> to follow up with the lead.
                      </p>
                    </div>
                  </td></tr>
                  <tr>
                    <td style="padding:16px 32px;background:#f8fafc;text-align:center;">
                      <p style="margin:0;font-size:11px;color:#94a3b8;">
                        This demo request was submitted via www.ezeeflo.com
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

      // ── Send email ──
      const result = await EmailService.sendCustomEmail(emailSettings, mailOptions);

      logger.info(`Demo request email sent for ${fullName} (${businessEmail})`);

      return res.status(200).json({
        success: true,
        message: 'Demo request submitted successfully. We will contact you soon!',
      });
    } catch (err) {
      logger.error('Demo request submission failed:', err);
      next(err);
    }
  }
}

// Helper: render a table row
function row(label, value) {
  return `<tr>
    <td style="padding:6px 12px 6px 0;font-size:13px;color:#64748b;font-weight:500;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;">${value || '—'}</td>
  </tr>`;
}

module.exports = new DemoRequestController();
