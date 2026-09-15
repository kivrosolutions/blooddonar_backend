import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CompleteProfileInput, UpdateProfileInput } from './profile.schema';
import { UploadsService } from '../uploads/uploads.service';
import { DocumentType } from '@prisma/client';

const uploadsService = new UploadsService();

export class ProfileService {
  async completeProfile(
    donorId: string,
    data: CompleteProfileInput,
    files: { [fieldname: string]: Express.Multer.File[] },
  ) {
    const donor = await prisma.donor.findFirst({
      where: { id: donorId, deletedAt: null },
      select: { id: true, bloodGroup: true, profileImage: true, profileImageFileId: true, isProfileCompleted: true },
    });

    if (!donor) {
      throw ApiError.notFound('Donor not found');
    }

    if (donor.isProfileCompleted) {
      throw ApiError.badRequest('Profile already completed. Use PUT /profile to update.');
    }

    const cnicFrontFile = files.cnicFront?.[0];
    const cnicBackFile = files.cnicBack?.[0];
    const bloodReportFile = files.bloodReport?.[0];
    const profileImageFile = files.profileImage?.[0];

    if (!cnicFrontFile) {
      throw ApiError.badRequest('CNIC front image is required');
    }
    if (!cnicBackFile) {
      throw ApiError.badRequest('CNIC back image is required');
    }
    if (!bloodReportFile) {
      throw ApiError.badRequest('Blood report is required');
    }

    const uploadPromises: Promise<{ url: string; fileId: string; type: string }>[] = [];

    if (profileImageFile) {
      uploadPromises.push(
        uploadsService.uploadToImageKit(profileImageFile.buffer, profileImageFile.originalname, `/donors/${donorId}/profile`, profileImageFile.mimetype)
          .then((r) => ({ url: r.url, fileId: r.fileId, type: 'profileImage' })),
      );
    }
    uploadPromises.push(
      uploadsService.uploadToImageKit(cnicFrontFile.buffer, cnicFrontFile.originalname, `/donors/${donorId}/cnic`, cnicFrontFile.mimetype)
        .then((r) => ({ url: r.url, fileId: r.fileId, type: 'cnicFront' })),
    );
    uploadPromises.push(
      uploadsService.uploadToImageKit(cnicBackFile.buffer, cnicBackFile.originalname, `/donors/${donorId}/cnic`, cnicBackFile.mimetype)
        .then((r) => ({ url: r.url, fileId: r.fileId, type: 'cnicBack' })),
    );
    uploadPromises.push(
      uploadsService.uploadToImageKit(bloodReportFile.buffer, bloodReportFile.originalname, `/donors/${donorId}/reports`, bloodReportFile.mimetype)
        .then((r) => ({ url: r.url, fileId: r.fileId, type: 'bloodReport' })),
    );

    const uploadResults = await Promise.all(uploadPromises);

    const updateData: Record<string, unknown> = {
      latitude: data.latitude,
      longitude: data.longitude,
      isAvailable: data.isAvailable,
      isProfileCompleted: true,
    };

    const dbPromises: Promise<unknown>[] = [];

    for (const { url, fileId, type } of uploadResults) {
      if (type === 'profileImage') {
        updateData.profileImage = url;
        updateData.profileImageFileId = fileId;
      } else if (type === 'cnicFront') {
        dbPromises.push(prisma.donorDocument.create({
          data: { donorId, type: 'CNIC_FRONT' as DocumentType, fileUrl: url, fileId, mimeType: cnicFrontFile.mimetype, fileSize: cnicFrontFile.size },
        }));
      } else if (type === 'cnicBack') {
        dbPromises.push(prisma.donorDocument.create({
          data: { donorId, type: 'CNIC_BACK' as DocumentType, fileUrl: url, fileId, mimeType: cnicBackFile.mimetype, fileSize: cnicBackFile.size },
        }));
      } else if (type === 'bloodReport') {
        const testedAt = new Date();
        const expiresAt = new Date(testedAt);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        dbPromises.push(prisma.bloodTestReport.create({
          data: { donorId, reportUrl: url, fileId, bloodGroup: donor.bloodGroup, testedAt, expiresAt, status: 'ACTIVE' },
        }));
      }
    }

    dbPromises.push(prisma.donor.update({ where: { id: donorId }, data: updateData }));
    await Promise.all(dbPromises);

    return { message: 'Profile completed successfully', isProfileCompleted: true };
  }

  async updateProfile(
    donorId: string,
    data: UpdateProfileInput,
    files?: { [fieldname: string]: Express.Multer.File[] },
  ) {
    const donor = await prisma.donor.findFirst({
      where: { id: donorId, deletedAt: null },
      select: { id: true, phone: true, cnicNumber: true, password: true, bloodGroup: true, profileImage: true, profileImageFileId: true },
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

    if (data.cnicNumber && data.cnicNumber !== donor.cnicNumber) {
      const existing = await prisma.donor.findUnique({
        where: { cnicNumber: data.cnicNumber },
      });
      if (existing) {
        throw ApiError.conflict('CNIC number already in use');
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

    if (files) {
      const profileImageFile = files.profileImage?.[0];
      const cnicFrontFile = files.cnicFront?.[0];
      const cnicBackFile = files.cnicBack?.[0];
      const bloodReportFile = files.bloodReport?.[0];

      const [existingCnicFront, existingCnicBack, existingReport] = await Promise.all([
        cnicFrontFile ? prisma.donorDocument.findFirst({ where: { donorId, type: 'CNIC_FRONT' as DocumentType } }) : null,
        cnicBackFile ? prisma.donorDocument.findFirst({ where: { donorId, type: 'CNIC_BACK' as DocumentType } }) : null,
        bloodReportFile ? prisma.bloodTestReport.findFirst({ where: { donorId, status: 'ACTIVE' } }) : null,
      ]);

      const deletePromises: Promise<void>[] = [];
      if (profileImageFile && donor.profileImageFileId) {
        deletePromises.push(uploadsService.deleteFile(donor.profileImageFileId).catch(() => {}));
      }
      if (existingCnicFront?.fileId) {
        deletePromises.push(uploadsService.deleteFile(existingCnicFront.fileId).catch(() => {}));
      }
      if (existingCnicBack?.fileId) {
        deletePromises.push(uploadsService.deleteFile(existingCnicBack.fileId).catch(() => {}));
      }
      if (existingReport?.fileId) {
        deletePromises.push(uploadsService.deleteFile(existingReport.fileId).catch(() => {}));
      }
      await Promise.all(deletePromises);

      const uploadPromises: Promise<{ url: string; fileId: string; type: string }>[] = [];
      if (profileImageFile) {
        uploadPromises.push(
          uploadsService.uploadToImageKit(profileImageFile.buffer, profileImageFile.originalname, `/donors/${donorId}/profile`, profileImageFile.mimetype)
            .then((r) => ({ url: r.url, fileId: r.fileId, type: 'profileImage' })),
        );
      }
      if (cnicFrontFile) {
        uploadPromises.push(
          uploadsService.uploadToImageKit(cnicFrontFile.buffer, cnicFrontFile.originalname, `/donors/${donorId}/cnic`, cnicFrontFile.mimetype)
            .then((r) => ({ url: r.url, fileId: r.fileId, type: 'cnicFront' })),
        );
      }
      if (cnicBackFile) {
        uploadPromises.push(
          uploadsService.uploadToImageKit(cnicBackFile.buffer, cnicBackFile.originalname, `/donors/${donorId}/cnic`, cnicBackFile.mimetype)
            .then((r) => ({ url: r.url, fileId: r.fileId, type: 'cnicBack' })),
        );
      }
      if (bloodReportFile) {
        uploadPromises.push(
          uploadsService.uploadToImageKit(bloodReportFile.buffer, bloodReportFile.originalname, `/donors/${donorId}/reports`, bloodReportFile.mimetype)
            .then((r) => ({ url: r.url, fileId: r.fileId, type: 'bloodReport' })),
        );
      }
      const uploadResults = await Promise.all(uploadPromises);

      const dbPromises: Promise<unknown>[] = [];
      for (const { url, fileId, type } of uploadResults) {
        if (type === 'profileImage') {
          updateData.profileImage = url;
          updateData.profileImageFileId = fileId;
        } else if (type === 'cnicFront') {
          if (existingCnicFront) {
            dbPromises.push(prisma.donorDocument.update({
              where: { id: existingCnicFront.id },
              data: { fileUrl: url, fileId, mimeType: cnicFrontFile!.mimetype, fileSize: cnicFrontFile!.size, uploadedAt: new Date() },
            }));
          } else {
            dbPromises.push(prisma.donorDocument.create({
              data: { donorId, type: 'CNIC_FRONT' as DocumentType, fileUrl: url, fileId, mimeType: cnicFrontFile!.mimetype, fileSize: cnicFrontFile!.size },
            }));
          }
        } else if (type === 'cnicBack') {
          if (existingCnicBack) {
            dbPromises.push(prisma.donorDocument.update({
              where: { id: existingCnicBack.id },
              data: { fileUrl: url, fileId, mimeType: cnicBackFile!.mimetype, fileSize: cnicBackFile!.size, uploadedAt: new Date() },
            }));
          } else {
            dbPromises.push(prisma.donorDocument.create({
              data: { donorId, type: 'CNIC_BACK' as DocumentType, fileUrl: url, fileId, mimeType: cnicBackFile!.mimetype, fileSize: cnicBackFile!.size },
            }));
          }
        } else if (type === 'bloodReport') {
          const testedAt = new Date();
          const expiresAt = new Date(testedAt);
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          if (existingReport) {
            dbPromises.push(prisma.bloodTestReport.update({
              where: { id: existingReport.id },
              data: { reportUrl: url, fileId, testedAt, expiresAt, status: 'ACTIVE' },
            }));
          } else {
            dbPromises.push(prisma.bloodTestReport.create({
              data: { donorId, reportUrl: url, fileId, bloodGroup: donor.bloodGroup || 'O_POSITIVE', testedAt, expiresAt, status: 'ACTIVE' },
            }));
          }
        }
      }
      await Promise.all(dbPromises);
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
        isProfileCompleted: true,
        profileImage: true,
        updatedAt: true,
      },
    });
  }
}
