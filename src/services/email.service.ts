import { Resend } from 'resend';
import { ApiError } from '../utils/ApiError';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

export class EmailService {
  async sendVerificationOtp(to: string, otp: string, donorName: string): Promise<void> {
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
          <h2 style="color:#333333;margin-bottom:20px;">Email Verification</h2>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            Hi ${donorName},
          </p>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            Thank you for registering. Please use the following OTP to verify your email address:
          </p>
          <div style="text-align:center;margin:30px 0;">
            <span style="display:inline-block;background-color:#e53e3e;color:#ffffff;font-size:32px;font-weight:bold;padding:15px 40px;border-radius:8px;letter-spacing:8px;">
              ${otp}
            </span>
          </div>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            This OTP will expire in 15 minutes.
          </p>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            If you did not create an account, please ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #eeeeee;margin:30px 0;">
          <p style="color:#999999;font-size:12px;text-align:center;">
            Blood Donation Platform &copy; ${new Date().getFullYear()}
          </p>
        </div>
      </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: `Blood Donation Platform <${EMAIL_FROM}>`,
        to,
        subject: 'Verify Your Email - Blood Donation Platform',
        html,
      });
      console.log(`Verification OTP sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send verification OTP to ${to}:`, error);
      throw ApiError.internal('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(to: string, donorName: string): Promise<void> {
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
          <h2 style="color:#333333;margin-bottom:20px;">Welcome aboard!</h2>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            Hi ${donorName},
          </p>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            Your email has been verified successfully. Welcome to the Blood Donation Platform!
          </p>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            You can now update your profile, manage your availability, and help save lives by donating blood.
          </p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${process.env.CORS_ORIGIN || 'http://localhost:3000'}" style="display:inline-block;background-color:#e53e3e;color:#ffffff;font-size:16px;font-weight:bold;padding:12px 30px;border-radius:8px;text-decoration:none;">
              Go to Dashboard
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #eeeeee;margin:30px 0;">
          <p style="color:#999999;font-size:12px;text-align:center;">
            Blood Donation Platform &copy; ${new Date().getFullYear()}
          </p>
        </div>
      </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: `Blood Donation Platform <${EMAIL_FROM}>`,
        to,
        subject: 'Welcome to Blood Donation Platform!',
        html,
      });
      console.log(`Welcome email sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send welcome email to ${to}:`, error);
    }
  }

  async sendPasswordReset(to: string, resetLink: string, donorName: string): Promise<void> {
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
          <h2 style="color:#333333;margin-bottom:20px;">Password Reset Request</h2>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            Hi ${donorName},
          </p>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            We received a request to reset your password. Click the button below to reset it:
          </p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${resetLink}" style="display:inline-block;background-color:#e53e3e;color:#ffffff;font-size:16px;font-weight:bold;padding:12px 30px;border-radius:8px;text-decoration:none;">
              Reset Password
            </a>
          </div>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            This link will expire in 1 hour.
          </p>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            If you did not request a password reset, please ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #eeeeee;margin:30px 0;">
          <p style="color:#999999;font-size:12px;text-align:center;">
            Blood Donation Platform &copy; ${new Date().getFullYear()}
          </p>
        </div>
      </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: `Blood Donation Platform <${EMAIL_FROM}>`,
        to,
        subject: 'Password Reset Request - Blood Donation Platform',
        html,
      });
      console.log(`Password reset email sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send password reset email to ${to}:`, error);
      throw ApiError.internal('Failed to send password reset email');
    }
  }

  async sendPasswordResetOtp(to: string, otp: string, donorName: string): Promise<void> {
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
          <h2 style="color:#333333;margin-bottom:20px;">Password Reset Request</h2>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            Hi ${donorName},
          </p>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            We received a request to reset your password. Please use the following OTP to reset it:
          </p>
          <div style="text-align:center;margin:30px 0;">
            <span style="display:inline-block;background-color:#e53e3e;color:#ffffff;font-size:32px;font-weight:bold;padding:15px 40px;border-radius:8px;letter-spacing:8px;">
              ${otp}
            </span>
          </div>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            This OTP will expire in 15 minutes.
          </p>
          <p style="color:#555555;font-size:16px;line-height:1.6;">
            If you did not request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border:none;border-top:1px solid #eeeeee;margin:30px 0;">
          <p style="color:#999999;font-size:12px;text-align:center;">
            Blood Donation Platform &copy; ${new Date().getFullYear()}
          </p>
        </div>
      </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: `Blood Donation Platform <${EMAIL_FROM}>`,
        to,
        subject: 'Password Reset OTP - Blood Donation Platform',
        html,
      });
      console.log(`Password reset OTP sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send password reset OTP to ${to}:`, error);
      throw ApiError.internal('Failed to send password reset email');
    }
  }
}
