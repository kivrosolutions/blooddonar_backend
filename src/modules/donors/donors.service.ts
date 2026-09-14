import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { UpdateDonorInput } from './donors.schema';
import { BloodGroup } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class DonorsService {
  async getAll() {
    return prisma.donor.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        bloodGroup: true,
        city: true,
        area: true,
        isAvailable: true,
        isVerified: true,
        totalDonations: true,
        lastDonationDate: true,
        createdAt: true,
      },
    });
  }

  async getById(id: string) {
    const donor = await prisma.donor.findFirst({
      where: { id, deletedAt: null },
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
        isVerified: true,
        profileImage: true,
        totalDonations: true,
        lastDonationDate: true,
        createdAt: true,
      },
    });

    if (!donor) {
      throw ApiError.notFound('Donor not found');
    }

    return donor;
  }

  async update(id: string, data: UpdateDonorInput) {
    const donor = await prisma.donor.findFirst({
      where: { id, deletedAt: null },
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
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        bloodGroup: true,
        city: true,
        area: true,
        isAvailable: true,
        profileImage: true,
        updatedAt: true,
      },
    });
  }

  async softDelete(id: string) {
    const donor = await prisma.donor.findFirst({
      where: { id, deletedAt: null },
    });

    if (!donor) {
      throw ApiError.notFound('Donor not found');
    }

    await prisma.donor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getByCityAndBloodGroup(city: string, bloodGroup: string) {
    return prisma.donor.findMany({
      where: {
        city,
        bloodGroup: bloodGroup as BloodGroup,
        isAvailable: true,
        isVerified: true,
        isActive: true,
        isBanned: false,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        bloodGroup: true,
        city: true,
        area: true,
        lastDonationDate: true,
      },
    });
  }
}
