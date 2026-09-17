// email delivery service using nodemailer and smtp credentials
import nodemailer from 'nodemailer';

let cachedTransporter = null;

/**
 * create and return nodemailer transporter with bounded timeouts
 * @returns {import('nodemailer').Transporter}
 */
const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return cachedTransporter;
};

/**
 * send password reset verification code email
 * @param {object} params
 * @param {string} params.to - recipient email address
 * @param {string} params.name - recipient user name
 * @param {string} params.code - 6-digit verification code
 * @returns {Promise<object>}
 */
export const sendPasswordResetCodeEmail = async ({ to, name, code }) => {
  const transporter = getTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USERNAME || 'noreply@foodman.com';
  const replyTo = process.env.SMTP_REPLY_TO || fromAddress;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoodMan Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
              <div style="display: inline-block; width: 44px; height: 44px; background: #e11d48; border-radius: 14px; text-align: center; line-height: 44px; color: #ffffff; font-size: 20px; font-weight: 900; margin-bottom: 10px;">
                FM
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px;">FoodMan</h1>
              <p style="margin: 4px 0 0; font-size: 12px; color: #64748b; font-weight: 600;">Craving Solved, Fast</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 12px; font-size: 17px; font-weight: 800; color: #0f172a;">Password Reset Code</h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #475569;">
                Hello <strong>${name || 'Valued User'}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #475569;">
                We received a request to reset the password for your FoodMan account. Use the 6-digit verification code below to complete your password reset:
              </p>

              <!-- Code Box -->
              <div style="background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #e11d48; display: inline-block;">
                  ${code}
                </span>
                <p style="margin: 10px 0 0; font-size: 11px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 1px;">
                  Expires in 10 minutes
                </p>
              </div>

              <p style="margin: 0 0 12px; font-size: 13px; line-height: 20px; color: #64748b;">
                <strong>Security Notice:</strong> Never share this code with anyone. FoodMan staff will never ask you for your verification code or password.
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #64748b;">
                If you did not request this password reset, please ignore this email or change your password immediately if you suspect unauthorized access.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} FoodMan Delivery Platform. All rights reserved.
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

  const textContent = `FoodMan Password Reset Code\n\n` +
    `Hello ${name || 'Valued User'},\n\n` +
    `Your 6-digit password reset code is: ${code}\n\n` +
    `This code will expire in 10 minutes.\n\n` +
    `If you did not request a password reset, please disregard this email.`;

  return transporter.sendMail({
    from: `"FoodMan" <${fromAddress}>`,
    to,
    replyTo,
    subject: `${code} is your FoodMan password reset code`,
    text: textContent,
    html: htmlContent,
  });
};
