import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import {
  generateAccessToken,
  generateRefreshToken,
  TokenPayload,
} from '../../utils/token';
import { RegisterInput, LoginInput, VerifyEmailInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema';
import { UploadsService } from '../uploads/uploads.service';
import { EmailService } from '../../services/email.service';

const uploadsService = new UploadsService();
const emailService = new EmailService();

export class AuthService {
  async register(data: RegisterInput, files?: { [fieldname: string]: Express.Multer.File[] }) {
    const existingDonor = await prisma.donor.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }, { cnicNumber: data.cnicNumber }],
      },
    });

    if (existingDonor) {
      if (existingDonor.email === data.email) {
        throw ApiError.conflict('Donor with this email already exists');
      }
      if (existingDonor.phone === data.phone) {
        throw ApiError.conflict('Donor with this phone number already exists');
      }
      throw ApiError.conflict('Donor with this CNIC number already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    const donor = await prisma.donor.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        cnicNumber: data.cnicNumber,
        password: hashedPassword,
        bloodGroup: data.bloodGroup,
        city: data.city,
        area: data.area,
        latitude: data.latitude,
        longitude: data.longitude,
        emailVerificationToken: otp,
        emailVerificationExpires,
        agreedToTermsAt: data.agreedToTermsAt ? new Date(data.agreedToTermsAt) : new Date(),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        bloodGroup: true,
        city: true,
        area: true,
        profileImage: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    let profileImageUrl: string | null = null;
    let profileImageFileId: string | null = null;
    let cnicFrontResult: { url: string; fileId: string } | null = null;
    let cnicBackResult: { url: string; fileId: string } | null = null;

    if (files) {
      const profileFile = files.profileImage?.[0];
      const cnicFrontFile = files.cnicFront?.[0];
      const cnicBackFile = files.cnicBack?.[0];

      const uploadResults = await Promise.all([
        profileFile
          ? uploadsService.uploadToImageKit(profileFile.buffer, profileFile.originalname, `/donors/${donor.id}/profile`, profileFile.mimetype)
          : Promise.resolve(null),
        cnicFrontFile
          ? uploadsService.uploadToImageKit(cnicFrontFile.buffer, cnicFrontFile.originalname, `/donors/${donor.id}/cnic`, cnicFrontFile.mimetype)
          : Promise.resolve(null),
        cnicBackFile
          ? uploadsService.uploadToImageKit(cnicBackFile.buffer, cnicBackFile.originalname, `/donors/${donor.id}/cnic`, cnicBackFile.mimetype)
          : Promise.resolve(null),
      ]);

      const [profileResult, cnicFrontUploaded, cnicBackUploaded] = uploadResults;

      if (profileResult) {
        profileImageUrl = profileResult.url;
        profileImageFileId = profileResult.fileId;
      }
      if (cnicFrontUploaded) {
        cnicFrontResult = { url: cnicFrontUploaded.url, fileId: cnicFrontUploaded.fileId };
      }
      if (cnicBackUploaded) {
        cnicBackResult = { url: cnicBackUploaded.url, fileId: cnicBackUploaded.fileId };
      }
    }

    if (profileImageUrl) {
      await prisma.donor.update({
        where: { id: donor.id },
        data: {
          profileImage: profileImageUrl,
          profileImageFileId,
        },
      });
      donor.profileImage = profileImageUrl;
    }

    const documentRecords: { type: string; fileUrl: string; mimeType: string; fileSize: number }[] = [];

    if (cnicFrontResult) {
      const cnicFrontFile = files?.cnicFront?.[0];
      const doc = await prisma.donorDocument.create({
        data: {
          donorId: donor.id,
          type: 'CNIC_FRONT',
          fileUrl: cnicFrontResult.url,
          fileId: cnicFrontResult.fileId,
          mimeType: cnicFrontFile?.mimetype || 'application/octet-stream',
          fileSize: cnicFrontFile?.size || 0,
          status: 'PENDING',
        },
      });
      documentRecords.push({
        type: doc.type,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
      });
    }

    if (cnicBackResult) {
      const cnicBackFile = files?.cnicBack?.[0];
      const doc = await prisma.donorDocument.create({
        data: {
          donorId: donor.id,
          type: 'CNIC_BACK',
          fileUrl: cnicBackResult.url,
          fileId: cnicBackResult.fileId,
          mimeType: cnicBackFile?.mimetype || 'application/octet-stream',
          fileSize: cnicBackFile?.size || 0,
          status: 'PENDING',
        },
      });
      documentRecords.push({
        type: doc.type,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
      });
    }

    const tokenPayload: TokenPayload = {
      donorId: donor.id,
      email: donor.email,
      role: donor.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await prisma.donorSession.create({
      data: {
        donorId: donor.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    emailService.sendVerificationOtp(donor.email, otp, donor.fullName).catch((err) => {
      console.error('Failed to send verification OTP:', err);
    });

    return {
      donor,
      documents: documentRecords,
      accessToken,
      refreshToken,
      emailVerificationRequired: true,
    };
  }

  async login(data: LoginInput, userAgent?: string, ipAddress?: string) {
    const donor = await prisma.donor.findUnique({
      where: { email: data.email },
    });

    if (!donor) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!donor.isActive) {
      throw ApiError.forbidden('Account has been deactivated');
    }

    if (donor.isBanned) {
      throw ApiError.forbidden('Account has been banned');
    }

    const isPasswordValid = await bcrypt.compare(data.password, donor.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokenPayload: TokenPayload = {
      donorId: donor.id,
      email: donor.email,
      role: donor.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await prisma.donorSession.create({
      data: {
        donorId: donor.id,
        refreshTokenHash,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.donor.update({
      where: { id: donor.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      donor: {
        id: donor.id,
        fullName: donor.fullName,
        email: donor.email,
        phone: donor.phone,
        bloodGroup: donor.bloodGroup,
        city: donor.city,
        role: donor.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    const { verifyRefreshToken } = await import('../../utils/token');
    const payload = verifyRefreshToken(token);

    const donor = await prisma.donor.findUnique({
      where: { id: payload.donorId },
    });

    if (!donor || !donor.isActive || donor.isBanned) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const newTokenPayload: TokenPayload = {
      donorId: donor.id,
      email: donor.email,
      role: donor.role,
    };

    const accessToken = generateAccessToken(newTokenPayload);
    const refreshToken = generateRefreshToken(newTokenPayload);

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(sessionId: string) {
    await prisma.donorSession.delete({
      where: { id: sessionId },
    });
  }

  async logoutAll(donorId: string) {
    await prisma.donorSession.deleteMany({
      where: { donorId },
    });
  }

  async verifyEmail(data: VerifyEmailInput) {
    const donor = await prisma.donor.findUnique({
      where: { email: data.email },
    });

    if (!donor) {
      throw ApiError.notFound('Donor not found');
    }

    if (donor.isEmailVerified) {
      throw ApiError.badRequest('Email is already verified');
    }

    if (!donor.emailVerificationToken || !donor.emailVerificationExpires) {
      throw ApiError.badRequest('No verification OTP found. Please request a new one.');
    }

    if (new Date() > donor.emailVerificationExpires) {
      throw ApiError.badRequest('OTP has expired. Please request a new one.');
    }

    if (donor.emailVerificationToken !== data.otp) {
      throw ApiError.badRequest('Invalid OTP');
    }

    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    await prisma.emailLog.create({
      data: {
        donorId: donor.id,
        type: 'VERIFICATION',
        subject: 'Email Verified',
        status: 'SENT',
      },
    });

    emailService.sendWelcomeEmail(donor.email, donor.fullName).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerificationOtp(email: string) {
    const donor = await prisma.donor.findUnique({
      where: { email },
    });

    if (!donor) {
      throw ApiError.notFound('Donor not found');
    }

    if (donor.isEmailVerified) {
      throw ApiError.badRequest('Email is already verified');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        emailVerificationToken: otp,
        emailVerificationExpires,
      },
    });

    await emailService.sendVerificationOtp(donor.email, otp, donor.fullName);

    return { message: 'Verification OTP sent successfully' };
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const donor = await prisma.donor.findUnique({
      where: { email: data.email },
    });

    if (!donor) {
      return { message: 'If email exists, reset OTP has been sent' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        passwordResetToken: otp,
        passwordResetExpires,
      },
    });

    emailService.sendPasswordResetOtp(donor.email, otp, donor.fullName).catch((err) => {
      console.error('Failed to send password reset OTP:', err);
    });

    return { message: 'If email exists, reset OTP has been sent' };
  }

  async resetPassword(data: ResetPasswordInput) {
    const donor = await prisma.donor.findUnique({
      where: { email: data.email },
    });

    if (!donor) {
      throw ApiError.notFound('Donor not found');
    }

    if (!donor.passwordResetToken || !donor.passwordResetExpires) {
      throw ApiError.badRequest('No reset OTP found. Please request a new one.');
    }

    if (new Date() > donor.passwordResetExpires) {
      throw ApiError.badRequest('OTP has expired. Please request a new one.');
    }

    if (donor.passwordResetToken !== data.otp) {
      throw ApiError.badRequest('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);

    await prisma.donor.update({
      where: { id: donor.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    await prisma.donorSession.deleteMany({
      where: { donorId: donor.id },
    });

    return { message: 'Password reset successfully' };
  }
}
