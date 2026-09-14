import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { CreateBloodRequestInput, UpdateBloodRequestInput } from './blood-requests.schema';
import { BloodGroup } from '@prisma/client';

export class BloodRequestsService {
  async create(data: CreateBloodRequestInput) {
    const request = await prisma.bloodRequest.create({
      data: {
        requesterName: data.requesterName,
        requesterPhone: data.requesterPhone,
        requesterEmail: data.requesterEmail,
        patientName: data.patientName,
        hospitalName: data.hospitalName,
        bloodGroup: data.bloodGroup,
        city: data.city,
        area: data.area,
        latitude: data.latitude,
        longitude: data.longitude,
        unitsRequired: data.unitsRequired,
        requiredByDate: data.requiredByDate ? new Date(data.requiredByDate) : null,
        notes: data.notes,
        status: 'PENDING',
      },
      select: {
        id: true,
        requesterName: true,
        requesterPhone: true,
        requesterEmail: true,
        patientName: true,
        hospitalName: true,
        bloodGroup: true,
        city: true,
        area: true,
        unitsRequired: true,
        requiredByDate: true,
        notes: true,
        status: true,
        createdAt: true,
      },
    });

    return request;
  }

  async getAll() {
    return prisma.bloodRequest.findMany({
      select: {
        id: true,
        requesterName: true,
        requesterPhone: true,
        bloodGroup: true,
        city: true,
        area: true,
        unitsRequired: true,
        requiredByDate: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const request = await prisma.bloodRequest.findUnique({
      where: { id },
      select: {
        id: true,
        requesterName: true,
        requesterPhone: true,
        requesterEmail: true,
        patientName: true,
        hospitalName: true,
        bloodGroup: true,
        city: true,
        area: true,
        latitude: true,
        longitude: true,
        unitsRequired: true,
        requiredByDate: true,
        notes: true,
        status: true,
        fulfilledAt: true,
        createdAt: true,
      },
    });

    if (!request) {
      throw ApiError.notFound('Blood request not found');
    }

    return request;
  }

  async update(id: string, data: UpdateBloodRequestInput, requesterEmail: string) {
    const request = await prisma.bloodRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw ApiError.notFound('Blood request not found');
    }

    if (request.requesterEmail !== requesterEmail) {
      throw ApiError.forbidden('You can only update your own blood requests');
    }

    const updateData: Record<string, unknown> = { ...data };

    if (data.requiredByDate) {
      updateData.requiredByDate = new Date(data.requiredByDate);
    }

    const updated = await prisma.bloodRequest.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        requesterName: true,
        requesterPhone: true,
        requesterEmail: true,
        patientName: true,
        hospitalName: true,
        bloodGroup: true,
        city: true,
        area: true,
        unitsRequired: true,
        requiredByDate: true,
        notes: true,
        status: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async cancel(id: string, requesterEmail: string) {
    const request = await prisma.bloodRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw ApiError.notFound('Blood request not found');
    }

    if (request.requesterEmail !== requesterEmail) {
      throw ApiError.forbidden('You can only cancel your own blood requests');
    }

    await prisma.bloodRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async search(city: string, bloodGroup: string) {
    return prisma.bloodRequest.findMany({
      where: {
        city,
        bloodGroup: bloodGroup as BloodGroup,
        status: 'PENDING',
      },
      select: {
        id: true,
        requesterName: true,
        bloodGroup: true,
        city: true,
        area: true,
        unitsRequired: true,
        requiredByDate: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
