import nodemailer from 'nodemailer';
import { ApiError } from '../utils/ApiError';

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} environment variable is not configured`);
  }

  return value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createEmailTemplate(
  title: string,
  heading: string,
  content: string,
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >
        <title>${escapeHtml(title)}</title>
      </head>

      <body
        style="
          margin:0;
          padding:20px;
          background-color:#f4f4f4;
          font-family:Arial,Helvetica,sans-serif;
        "
      >
        <div
          style="
            max-width:600px;
            margin:0 auto;
            background-color:#ffffff;
            padding:40px;
            border-radius:8px;
          "
        >
          <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#e53e3e;margin:0;font-size:28px;">
              Blood Donation Platform
            </h1>
          </div>

          <h2 style="color:#333333;margin-bottom:20px;">
            ${escapeHtml(heading)}
          </h2>

          ${content}

          <hr
            style="
              border:none;
              border-top:1px solid #eeeeee;
              margin:30px 0;
            "
          >

          <p
            style="
              color:#999999;
              font-size:12px;
              text-align:center;
            "
          >
            Kivro Solutions | Blood Donation Platform
            &copy; ${new Date().getFullYear()}
          </p>
        </div>
      </body>
    </html>
  `;
}

const SMTP_HOST = getRequiredEnv('SMTP_HOST');
const SMTP_PORT = parseInt(getRequiredEnv('SMTP_PORT'), 10);
const SMTP_USER = getRequiredEnv('SMTP_USER');
const SMTP_PASS = getRequiredEnv('SMTP_PASS');
const EMAIL_FROM = getRequiredEnv('EMAIL_FROM');
const EMAIL_REPLY_TO = getRequiredEnv('EMAIL_REPLY_TO');

const FRONTEND_URL = process.env.FRONTEND_URL
  ?.trim()
  .replace(/\/+$/, '');

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

const FROM_ADDRESS =
  `Kivro Solutions | Blood Donation <${EMAIL_FROM}>`;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  logMessage: string;
  failureMessage: string;
  throwOnFailure?: boolean;
}

export class EmailService {
  private async sendEmail({
    to,
    subject,
    html,
    text,
    logMessage,
    failureMessage,
    throwOnFailure = true,
  }: SendEmailOptions): Promise<void> {
    try {
      const info = await transporter.sendMail({
        from: FROM_ADDRESS,
        to,
        replyTo: EMAIL_REPLY_TO,
        subject,
        html,
        text,
      });

      console.log(`${logMessage}. Message ID: ${info.messageId}`);
    } catch (error) {
      console.error(`${failureMessage}:`, error);

      if (throwOnFailure) {
        throw ApiError.internal(failureMessage);
      }
    }
  }

  async sendVerificationOtp(
    to: string,
    otp: string,
    donorName: string,
  ): Promise<void> {
    const safeDonorName = escapeHtml(donorName);
    const safeOtp = escapeHtml(otp);

    const content = `
      <p style="color:#555555;font-size:16px;line-height:1.6;">
        Hi ${safeDonorName},
      </p>

      <p style="color:#555555;font-size:16px;line-height:1.6;">
        Thank you for registering with the Blood Donation Platform.
        Use the verification code below to verify your email address.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <span
          style="
            display:inline-block;
            background-color:#e53e3e;
            color:#ffffff;
            font-size:32px;
            font-weight:bold;
            padding:15px 40px;
            border-radius:8px;
            letter-spacing:8px;
          "
        >
          ${safeOtp}
        </span>
      </div>

      <p style="color:#555555;font-size:16px;line-height:1.6;">
        This verification code expires in 15 minutes.
      </p>

      <p style="color:#555555;font-size:16px;line-height:1.6;">
        If you did not create this account, you can safely ignore
        this email.
      </p>
    `;

    const html = createEmailTemplate(
      'Email Verification',
      'Verify your email',
      content,
    );

    const text = `
Hi ${donorName},

Thank you for registering with the Blood Donation Platform.

Your email verification code is:

${otp}

This verification code expires in 15 minutes.

If you did not create this account, you can safely ignore this email.

Kivro Solutions | Blood Donation Platform
    `.trim();

    await this.sendEmail({
      to,
      subject: 'Your Blood Donation verification code',
      html,
      text,
      logMessage: `Verification OTP sent to ${to}`,
      failureMessage: 'Failed to send verification email',
    });
  }

  async sendWelcomeEmail(
    to: string,
    donorName: string,
  ): Promise<void> {
    const safeDonorName = escapeHtml(donorName);

    const dashboardButton = FRONTEND_URL
      ? `
          <div style="text-align:center;margin:30px 0;">
            <a
              href="${escapeHtml(FRONTEND_URL)}"
              style="
                display:inline-block;
                background-color:#e53e3e;
                color:#ffffff;
                font-size:16px;
                font-weight:bold;
                padding:12px 30px;
                border-radius:8px;
                text-decoration:none;
              "
            >
              Go to Dashboard
            </a>
          </div>
        `
      : '';

    const content = `
      <p style="color:#555555;font-size:16px;line-height:1.6;">
        Hi ${safeDonorName},
      </p>

      <p style="color:#555555;font-size:16px;line-height:1.6;">
        Your email has been verified successfully. Welcome to the
        Blood Donation Platform!
      </p>

      <p style="color:#555555;font-size:16px;line-height:1.6;">
        You can now update your profile, manage your availability,
        and help save lives by donating blood.
      </p>

      ${dashboardButton}
    `;

    const html = createEmailTemplate(
      'Welcome to Blood Donation Platform',
      'Welcome aboard!',
      content,
    );

    const dashboardText = FRONTEND_URL
      ? `\nOpen your dashboard:\n${FRONTEND_URL}\n`
      : '';

    const text = `
Hi ${donorName},

Your email has been verified successfully.

Welcome to the Blood Donation Platform!

You can now update your profile, manage your availability, and help save lives by donating blood.
${dashboardText}
Kivro Solutions | Blood Donation Platform
    `.trim();

    await this.sendEmail({
      to,
      subject: 'Welcome to the Blood Donation Platform',
      html,
      text,
      logMessage: `Welcome email sent to ${to}`,
      failureMessage: 'Failed to send welcome email',
      throwOnFailure: false,
    });
  }

  async sendPasswordReset(
    to: string,
    resetLink: string,
    donorName: string,
  ): Promise<void> {
    const safeDonorName = escapeHtml(donorName);
    const safeResetLink = escapeHtml(resetLink);

    const content = `
      <p style="color:#555555;font-size:16px;line-height:1.6;">
        Hi ${safeDonorName},
      </p>

      <p style="color:#555555;font-size:16px;line-height:1.6;">
        We received a request to reset your password. Click the
        button below to choose a new password.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <a
          href="${safeResetLink}"
          style="
            display:inline-block;
            background-color:#e53e3e;
            color:#ffffff;
            font-size:16px;
            font-weight:bold;
            padding:12px 30px;
            border-radius:8px;
            text-decoration:none;
          "
        >
          Reset Password
        </a>
      </div>

      <p style="color:#555555;font-size:16px;line-height:1.6;">
        This password-reset link expires in 1 hour.
      </p>

      <p style="color:#555555;font-size:16px;line-height:1.6;">
        If you did not request a password reset, you can safely
        ignore this email. Your password will remain unchanged.
      </p>
    `;

    const html = createEmailTemplate(
      'Reset Your Password',
      'Reset your password',
      content,
    );

    const text = `
Hi ${donorName},

We received a request to reset your Blood Donation Platform password.

Open the following link to choose a new password:

${resetLink}

This password-reset link expires in 1 hour.

If you did not request this, you can safely ignore this email. Your password will remain unchanged.

Kivro Solutions | Blood Donation Platform
    `.trim();

    await this.sendEmail({
      to,
      subject: 'Reset your Blood Donation Platform password',
      html,
      text,
      logMessage: `Password reset email sent to ${to}`,
      failureMessage: 'Failed to send password reset email',
    });
  }

  async sendPasswordResetOtp(
    to: string,
    otp: string,
    donorName: string,
  ): Promise<void> {
    const safeDonorName = escapeHtml(donorName);
    const safeOtp = escapeHtml(otp);

    const content = `
      <p style="color:#555555;font-size:16px;line-height:1.6;">
        Hi ${safeDonorName},
      </p>

      <p style="color:#555555;font-size:16px;line-height:1.6;">
        We received a request to reset your password. Use the code
        below to continue.
      </p>

      <div style="text-align:center;margin:30px 0;">
        <span
          style="
            display:inline-block;
            background-color:#e53e3e;
            color:#ffffff;
            font-size:32px;
            font-weight:bold;
            padding:15px 40px;
            border-radius:8px;
            letter-spacing:8px;
          "
        >
          ${safeOtp}
        </span>
      </div>

      <p style="color:#555555;font-size:16px;line-height:1.6;">
        This password-reset code expires in 15 minutes.
      </p>

      <p style="color:#555555;font-size:16px;line-height:1.6;">
        If you did not request this, you can safely ignore this
        email. Your password will remain unchanged.
      </p>
    `;

    const html = createEmailTemplate(
      'Password Reset Code',
      'Password reset code',
      content,
    );

    const text = `
Hi ${donorName},

We received a request to reset your Blood Donation Platform password.

Your password-reset code is:

${otp}

This code expires in 15 minutes.

If you did not request this, you can safely ignore this email. Your password will remain unchanged.

Kivro Solutions | Blood Donation Platform
    `.trim();

    await this.sendEmail({
      to,
      subject: 'Your Blood Donation password reset code',
      html,
      text,
      logMessage: `Password reset OTP sent to ${to}`,
      failureMessage: 'Failed to send password reset email',
    });
  }

  async sendBloodRequestEmail(
    to: string,
    donorName: string,
    requesterName: string,
    requesterPhone: string,
    requesterEmail: string,
    bloodGroup: string,
    message?: string,
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background-color:#ffffff;padding:40px;margin-top:20px;margin-bottom:20px;border-radius:8px;">
          <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#e53e3e;margin:0;font-size:28px;">Blood Donation Platform</h1>
          </div>
          <h2 style="color:#333333;margin-bottom:20px;">Blood Request</h2>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            Hi ${donorName},
          </p>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            Someone in your area needs your help! A blood request has been made for <strong>${bloodGroup}</strong> blood.
          </p>
          <div style="background-color:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="color:#333333;font-size:16px;margin:5px 0;"><strong>Requester:</strong> ${requesterName}</p>
            <p style="color:#333333;font-size:16px;margin:5px 0;"><strong>Phone:</strong> ${requesterPhone}</p>
            <p style="color:#333333;font-size:16px;margin:5px 0;"><strong>Email:</strong> ${requesterEmail}</p>
            <p style="color:#333333;font-size:16px;margin:5px 0;"><strong>Blood Group:</strong> ${bloodGroup}</p>
            ${message ? `<p style="color:#333333;font-size:16px;margin:5px 0;"><strong>Message:</strong> ${message}</p>` : ''}
          </div>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            If you can help, please contact them directly.
          </p>
          <hr style="border:none;border-top:1px solid #eeeeee;margin:30px 0;">
          <p style="color:#999999;font-size:12px;text-align:center;">
            Blood Donation Platform &copy; ${new Date().getFullYear()}
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Blood Request

Hi ${donorName},

Someone in your area needs your help! A blood request has been made for ${bloodGroup} blood.

Requester: ${requesterName}
Phone: ${requesterPhone}
Email: ${requesterEmail}
Blood Group: ${bloodGroup}
${message ? `Message: ${message}` : ''}

If you can help, please contact them directly.

Blood Donation Platform
    `.trim();

    await this.sendEmail({
      to,
      subject: `Blood Request - ${bloodGroup} needed`,
      html,
      text,
      logMessage: `Blood request email sent to ${to}`,
      failureMessage: 'Failed to send blood request email',
    });
  }
}