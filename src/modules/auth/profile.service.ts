import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { UpdateProfileInput, UploadDocumentInput } from './profile.schema';
import { UploadsService } from '../uploads/uploads.service';
import { DocumentType } from '@prisma/client';

const uploadsService = new UploadsService();

export class ProfileService {
  async updateProfile(donorId: string, data: UpdateProfileInput) {
    const donor = await prisma.donor.findFirst({
      where: { id: donorId, deletedAt: null },
    });

    if (!donor) {
      throw ApiError.notFound('Donor not found');
    }

    if (data.phone && data.phone !== donor.phone) {
      const existing = await prisma.donor.findUnique({
        where: { phone: data.phone },
      });
      if (existing) {
        throw ApiError.conflict('Phone number already in use');
      }
    }

    const { currentPassword, newPassword, ...profileData } = data;

    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, donor.password);
      if (!isPasswordValid) {
        throw ApiError.unauthorized('Current password is incorrect');
      }
    }

    const updateData: Record<string, unknown> = { ...profileData };

    if (currentPassword && newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    return prisma.donor.update({
      where: { id: donorId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        bloodGroup: true,
        city: true,
        area: true,
        latitude: true,
        longitude: true,
        isAvailable: true,
        profileImage: true,
        updatedAt: true,
      },
    });
  }

  async updateProfileImage(donorId: string, file: Express.Multer.File) {
    const donor = await prisma.donor.findFirst({
      where: { id: donorId, deletedAt: null },
      select: { id: true, profileImage: true, profileImageFileId: true },
    });

    if (!donor) {
      throw ApiError.notFound('Donor not found');
    }

    const result = await uploadsService.replaceFile(
      donor.profileImageFileId || null,
      file.buffer,
      file.originalname,
      `/donors/${donorId}/profile`,
      file.mimetype,
    );

    await prisma.donor.update({
      where: { id: donorId },
      data: {
        profileImage: result.url,
        profileImageFileId: result.fileId,
      },
    });

    return { profileImage: result.url };
  }

  async uploadDocument(donorId: string, data: UploadDocumentInput, file: Express.Multer.File) {
    const donor = await prisma.donor.findFirst({
      where: { id: donorId, deletedAt: null },
    });

    if (!donor) {
      throw ApiError.notFound('Donor not found');
    }

    const existingDoc = await prisma.donorDocument.findFirst({
      where: {
        donorId,
        type: data.type as DocumentType,
      },
    });

    if (existingDoc && existingDoc.fileId) {
      try {
        await uploadsService.deleteFile(existingDoc.fileId);
      } catch {
        // Old file may already be deleted in ImageKit, continue with upload
      }
    }

    const result = await uploadsService.uploadToImageKit(
      file.buffer,
      file.originalname,
      `/donors/${donorId}/cnic`,
      file.mimetype,
    );

    if (existingDoc) {
      const updated = await prisma.donorDocument.update({
        where: { id: existingDoc.id },
        data: {
          fileUrl: result.url,
          fileId: result.fileId,
          mimeType: file.mimetype,
          fileSize: file.size,
          status: 'PENDING',
          uploadedAt: new Date(),
          reviewedAt: null,
          rejectionReason: null,
        },
      });
      return {
        document: {
          id: updated.id,
          type: updated.type,
          fileUrl: updated.fileUrl,
          mimeType: updated.mimeType,
          fileSize: updated.fileSize,
          status: updated.status,
        },
      };
    }

    const doc = await prisma.donorDocument.create({
      data: {
        donorId,
        type: data.type as DocumentType,
        fileUrl: result.url,
        fileId: result.fileId,
        mimeType: file.mimetype,
        fileSize: file.size,
        status: 'PENDING',
      },
    });

    return {
      document: {
        id: doc.id,
        type: doc.type,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
        fileSize: doc.fileSize,
        status: doc.status,
      },
    };
  }

  async getDocuments(donorId: string) {
    const docs = await prisma.donorDocument.findMany({
      where: { donorId },
      select: {
        id: true,
        type: true,
        fileUrl: true,
        mimeType: true,
        fileSize: true,
        status: true,
        rejectionReason: true,
        uploadedAt: true,
        reviewedAt: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return docs;
  }
}
