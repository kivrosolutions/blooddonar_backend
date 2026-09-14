import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { UploadReportInput, UpdateReportInput } from './blood-reports.schema';
import { UploadsService } from '../uploads/uploads.service';

const uploadsService = new UploadsService();

export class BloodReportsService {
  async upload(donorId: string, data: UploadReportInput, file: Express.Multer.File) {
    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
      select: { bloodGroup: true },
    });

    const bloodGroup = data.bloodGroup || donor?.bloodGroup;

    if (!bloodGroup) {
      throw ApiError.badRequest('Blood group is required. Please provide one or update your profile.');
    }

    const result = await uploadsService.uploadToImageKit(
      file.buffer,
      file.originalname,
      `/donors/${donorId}/reports`,
      file.mimetype,
    );

    const testedAt = data.testedAt ? new Date(data.testedAt) : new Date();
    const expiresAt = new Date(testedAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const report = await prisma.bloodTestReport.create({
      data: {
        donorId,
        reportUrl: result.url,
        fileId: result.fileId,
        bloodGroup,
        labName: data.labName,
        hemoglobinLevel: data.hemoglobinLevel,
        testedAt,
        expiresAt,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        donorId: true,
        reportUrl: true,
        bloodGroup: true,
        labName: true,
        hemoglobinLevel: true,
        testedAt: true,
        expiresAt: true,
        status: true,
        uploadedAt: true,
      },
    });

    return report;
  }

  async getMyReports(donorId: string) {
    return prisma.bloodTestReport.findMany({
      where: { donorId },
      select: {
        id: true,
        reportUrl: true,
        bloodGroup: true,
        labName: true,
        hemoglobinLevel: true,
        testedAt: true,
        expiresAt: true,
        status: true,
        uploadedAt: true,
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async update(donorId: string, reportId: string, data: UpdateReportInput, file?: Express.Multer.File) {
    const report = await prisma.bloodTestReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw ApiError.notFound('Report not found');
    }

    if (report.donorId !== donorId) {
      throw ApiError.forbidden('You can only update your own reports');
    }

    const updateData: Record<string, unknown> = {};

    if (data.bloodGroup) updateData.bloodGroup = data.bloodGroup;
    if (data.labName !== undefined) updateData.labName = data.labName;
    if (data.hemoglobinLevel !== undefined) updateData.hemoglobinLevel = data.hemoglobinLevel;

    if (data.testedAt) {
      const testedAt = new Date(data.testedAt);
      const expiresAt = new Date(testedAt);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      updateData.testedAt = testedAt;
      updateData.expiresAt = expiresAt;
    }

    if (file) {
      if (report.fileId) {
        try {
          await uploadsService.deleteFile(report.fileId);
        } catch {
          // Old file may already be deleted in ImageKit
        }
      }

      const result = await uploadsService.uploadToImageKit(
        file.buffer,
        file.originalname,
        `/donors/${donorId}/reports`,
        file.mimetype,
      );
      updateData.reportUrl = result.url;
      updateData.fileId = result.fileId;
    }

    const updated = await prisma.bloodTestReport.update({
      where: { id: reportId },
      data: updateData,
      select: {
        id: true,
        donorId: true,
        reportUrl: true,
        bloodGroup: true,
        labName: true,
        hemoglobinLevel: true,
        testedAt: true,
        expiresAt: true,
        status: true,
        uploadedAt: true,
      },
    });

    return updated;
  }

  async delete(donorId: string, reportId: string) {
    const report = await prisma.bloodTestReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw ApiError.notFound('Report not found');
    }

    if (report.donorId !== donorId) {
      throw ApiError.forbidden('You can only delete your own reports');
    }

    if (report.fileId) {
      try {
        await uploadsService.deleteFile(report.fileId);
      } catch {
        // File may already be deleted in ImageKit
      }
    }

    await prisma.bloodTestReport.delete({
      where: { id: reportId },
    });
  }
}
