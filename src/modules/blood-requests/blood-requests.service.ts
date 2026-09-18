import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { EmailService } from '../../services/email.service';

const emailService = new EmailService();

export class BloodRequestsService {
  async create(donorId: string, phone: string, note?: string) {
    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
      select: { id: true, fullName: true, email: true, phone: true, bloodGroup: true, isAvailable: true, deletedAt: true },
    });

    if (!donor || donor.deletedAt) {
      throw ApiError.notFound('Donor not found');
    }

    if (!donor.isAvailable) {
      throw ApiError.badRequest('This donor is currently not available');
    }

    if (donor.phone === phone) {
      throw ApiError.badRequest('You cannot request blood from yourself');
    }

    const request = await prisma.bloodRequest.create({
      data: {
        requesterName: '',
        requesterPhone: phone,
        requesterEmail: '',
        bloodGroup: donor.bloodGroup,
        city: '',
        area: '',
        notes: note,
        status: 'PENDING',
      },
      select: { id: true, createdAt: true },
    });

    await emailService.sendBloodRequestEmail(
      donor.email,
      donor.fullName,
      '',
      phone,
      '',
      donor.bloodGroup,
      note,
    );

    return request;
  }
}
