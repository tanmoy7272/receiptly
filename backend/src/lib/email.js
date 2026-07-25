import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Nodemailer transporter configured for Brevo SMTP.
 * Credentials are read exclusively from environment variables.
 */
const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false, // STARTTLS on port 587
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
  connectionTimeout: 10000, // 10s connection timeout
  greetingTimeout: 10000,   // 10s greeting timeout
  socketTimeout: 15000,     // 15s socket activity timeout
});

/**
 * Verify SMTP connection is working.
 * Called by the dev-only test endpoint.
 */
export const verifySmtpConnection = async () => {
  await transporter.verify();
  return true;
};

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receiptly</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Inter',system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Receiptly</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                This is an automated message from Receiptly. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const verificationEmailContent = (otp) => `
  <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Verify your email</h2>
  <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.5;">
    Welcome to Receiptly! Enter the code below to verify your email address and activate your account.
  </p>
  <div style="text-align:center;margin:0 0 24px;">
    <div style="display:inline-block;background-color:#f1f5f9;border:2px solid #e2e8f0;border-radius:8px;padding:16px 32px;letter-spacing:8px;font-size:32px;font-weight:700;color:#0f172a;">
      ${otp}
    </div>
  </div>
  <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-align:center;">
    This code expires in <strong>5 minutes</strong>.
  </p>
  <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
    If you didn't create a Receiptly account, you can safely ignore this email.
  </p>
`;

const passwordResetEmailContent = (otp) => `
  <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Reset your password</h2>
  <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.5;">
    We received a request to reset your Receiptly password. Enter the code below to proceed.
  </p>
  <div style="text-align:center;margin:0 0 24px;">
    <div style="display:inline-block;background-color:#f1f5f9;border:2px solid #e2e8f0;border-radius:8px;padding:16px 32px;letter-spacing:8px;font-size:32px;font-weight:700;color:#0f172a;">
      ${otp}
    </div>
  </div>
  <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-align:center;">
    This code expires in <strong>5 minutes</strong>.
  </p>
  <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
    If you didn't request a password reset, you can safely ignore this email.
  </p>
`;

// ---------------------------------------------------------------------------
// Send Functions
// ---------------------------------------------------------------------------

/**
 * Send an OTP email using Brevo HTTPS REST API (instant 200ms delivery),
 * falling back to Nodemailer SMTP transporter if API fails.
 */
export const sendOtpEmail = async (to, otp, purpose) => {
  const isVerification = purpose === 'EMAIL_VERIFICATION';

  const subject = isVerification
    ? 'Verify your Receiptly account'
    : 'Reset your Receiptly password';

  const html = baseTemplate(
    isVerification ? verificationEmailContent(otp) : passwordResetEmailContent(otp)
  );

  // Parse sender email from config.smtpFrom (e.g. "Receiptly <noreply@domain.com>" or "email@domain.com")
  const fromMatch = config.smtpFrom.match(/<([^>]+)>/) || [null, config.smtpFrom.trim()];
  const senderEmail = fromMatch[1] || config.smtpFrom.trim();

  // Try Brevo HTTPS REST API first for ultra-fast, firewall-proof delivery
  const apiKey = config.brevoApiKey;
  if (apiKey && apiKey.startsWith('xkeysib-')) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Receiptly', email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
      });

      const data = await response.json();
      if (response.ok && data.messageId) {
        logger.info(`OTP email delivered via Brevo API to ${to} (purpose: ${purpose}, messageId: ${data.messageId})`);
        return data;
      }
      logger.warn(`Brevo API status ${response.status}: ${JSON.stringify(data)}. Falling back to Nodemailer SMTP...`);
    } catch (apiErr) {
      logger.warn(`Brevo API error: ${apiErr.message}. Falling back to Nodemailer SMTP...`);
    }
  }

  // Fallback to standard Nodemailer SMTP transport
  try {
    const info = await transporter.sendMail({
      from: config.smtpFrom,
      to,
      subject,
      html,
    });
    logger.info(`OTP email sent via Nodemailer SMTP to ${to} (purpose: ${purpose}, messageId: ${info.messageId})`);
    return info;
  } catch (error) {
    logger.error(`Failed to send OTP email to ${to}`, error.stack || error.message);
    throw error;
  }
};

/**
 * Send a test email (development only).
 */
export const sendTestEmail = async (to) => {
  return sendOtpEmail(to, '123456', 'EMAIL_VERIFICATION');
};
