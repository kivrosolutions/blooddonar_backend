import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { EmailService } from '../../services/email.service';

const emailService = new EmailService();

export class BloodRequestsService {
  async create(donorId: string, requesterDonorId: string) {
    if (donorId === requesterDonorId) {
      throw ApiError.badRequest('You cannot request blood from yourself');
    }

    const requester = await prisma.donor.findUnique({
      where: { id: requesterDonorId },
      select: { id: true, fullName: true, phone: true, email: true, bloodGroup: true },
    });

    if (!requester) {
      throw ApiError.unauthorized('Requester not found');
    }

    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
      select: { id: true, fullName: true, email: true, isAvailable: true, deletedAt: true },
    });

    if (!donor || donor.deletedAt) {
      throw ApiError.notFound('Donor not found');
    }

    if (!donor.isAvailable) {
      throw ApiError.badRequest('This donor is currently not available');
    }

    const request = await prisma.bloodRequest.create({
      data: {
        requesterName: requester.fullName,
        requesterPhone: requester.phone,
        requesterEmail: requester.email,
        bloodGroup: requester.bloodGroup,
        city: '',
        area: '',
        status: 'PENDING',
      },
      select: { id: true, createdAt: true },
    });

    await emailService.sendBloodRequestEmail(
      donor.email,
      donor.fullName,
      requester.fullName,
      requester.phone,
      requester.email,
      requester.bloodGroup,
    );

    return request;
  }
}
