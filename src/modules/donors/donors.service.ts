import prisma from '../../config/database';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../utils/ApiError';
import { UpdateDonorInput, DonorsQueryInput } from './donors.schema';
import { BloodGroup } from '@prisma/client';
import bcrypt from 'bcryptjs';

interface DonorWithDistance {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bloodGroup: string;
  city: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  isAvailable: number;
  isVerified: number;
  totalDonations: number;
  lastDonationDate: Date | null;
  createdAt: Date;
  distance_km: number;
}

export class DonorsService {
  async getAll(query: DonorsQueryInput, donorId?: string) {
    if (query.radius !== undefined) {
      return this.findNearby(query, donorId);
    }
    return this.findAllPaginated(query, donorId);
  }

  private async findAllPaginated(query: DonorsQueryInput, donorId?: string) {
    const { page, limit, city, bloodGroup, isAvailable, sortBy, order } = query;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(donorId && { id: { not: donorId } }),
      ...(city && { city }),
      ...(bloodGroup && { bloodGroup: bloodGroup as BloodGroup }),
      ...(isAvailable !== undefined && { isAvailable }),
    };

    const [donors, total] = await Promise.all([
      prisma.donor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
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
      }),
      prisma.donor.count({ where }),
    ]);

    return {
      donors,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async findNearby(query: DonorsQueryInput, donorId?: string) {
    if (!donorId) {
      throw ApiError.unauthorized('Authentication required for radius filter');
    }

    const user = await prisma.donor.findUnique({
      where: { id: donorId },
      select: { latitude: true, longitude: true },
    });

    if (!user?.latitude || !user?.longitude) {
      throw ApiError.badRequest('Your profile location is not set. Please update your profile with latitude and longitude.');
    }

    const { page, limit, city, bloodGroup, isAvailable } = query;
    const radius = query.radius!;
    const skip = (page - 1) * limit;
    const { latitude: userLat, longitude: userLng } = user;

    const latDelta = radius / 111.0;
    const lngDelta = radius / (111.0 * Math.cos((userLat * Math.PI) / 180));

    const conditions: Prisma.Sql[] = [
      Prisma.sql`\`deletedAt\` IS NULL`,
      Prisma.sql`\`latitude\` IS NOT NULL`,
      Prisma.sql`\`longitude\` IS NOT NULL`,
      Prisma.sql`\`latitude\` BETWEEN ${userLat - latDelta} AND ${userLat + latDelta}`,
      Prisma.sql`\`longitude\` BETWEEN ${userLng - lngDelta} AND ${userLng + lngDelta}`,
    ];

    if (donorId) conditions.push(Prisma.sql`\`id\` != ${donorId}`);
    if (city) conditions.push(Prisma.sql`\`city\` = ${city}`);
    if (bloodGroup) conditions.push(Prisma.sql`\`bloodGroup\` = ${bloodGroup}`);
    if (isAvailable !== undefined) conditions.push(Prisma.sql`\`isAvailable\` = ${isAvailable ? 1 : 0}`);

    const whereClause = Prisma.join(conditions, ` AND `);

    const haversine = Prisma.sql`
      6371 * LEAST(1.0, ACOS(
        COS(RADIANS(${userLat})) * COS(RADIANS(\`latitude\`))
        * COS(RADIANS(\`longitude\`) - RADIANS(${userLng}))
        + SIN(RADIANS(${userLat})) * SIN(RADIANS(\`latitude\`))
      ))
    `;

    const [donors, countResult] = await Promise.all([
      prisma.$queryRaw<DonorWithDistance[]>`
        SELECT * FROM (
          SELECT
            \`id\`, \`fullName\`, \`email\`, \`phone\`, \`bloodGroup\`,
            \`city\`, \`area\`, \`latitude\`, \`longitude\`,
            \`isAvailable\`, \`isVerified\`, \`totalDonations\`,
            \`lastDonationDate\`, \`createdAt\`,
            (${haversine}) AS distance_km
          FROM \`donors\`
          WHERE ${whereClause}
        ) AS nearby
        WHERE distance_km <= ${radius}
        ORDER BY distance_km ASC
        LIMIT ${limit} OFFSET ${skip}
      `,
      prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*) AS total FROM (
          SELECT \`id\` FROM (
            SELECT \`id\`, (${haversine}) AS distance_km
            FROM \`donors\`
            WHERE ${whereClause}
          ) AS inner_query
          WHERE distance_km <= ${radius}
        ) AS count_query
      `,
    ]);

    return {
      donors: donors.map((d) => ({
        ...d,
        isAvailable: Boolean(d.isAvailable),
        isVerified: Boolean(d.isVerified),
        distance_km: Number(Number(d.distance_km).toFixed(2)),
      })),
      pagination: {
        page,
        limit,
        total: Number(countResult[0].total),
        totalPages: Math.ceil(Number(countResult[0].total) / limit),
      },
    };
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

    if (!donor) throw ApiError.notFound('Donor not found');
    return donor;
  }

  async update(id: string, data: UpdateDonorInput) {
    const donor = await prisma.donor.findFirst({
      where: { id, deletedAt: null },
    });

    if (!donor) throw ApiError.notFound('Donor not found');

    if (data.phone && data.phone !== donor.phone) {
      const existing = await prisma.donor.findUnique({ where: { phone: data.phone } });
      if (existing) throw ApiError.conflict('Phone number already in use');
    }

    const { currentPassword, newPassword, ...profileData } = data;
    const updateData: Record<string, unknown> = { ...profileData };

    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, donor.password);
      if (!isPasswordValid) throw ApiError.unauthorized('Current password is incorrect');
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
    const donor = await prisma.donor.findFirst({ where: { id, deletedAt: null } });
    if (!donor) throw ApiError.notFound('Donor not found');
    await prisma.donor.update({ where: { id }, data: { deletedAt: new Date() } });
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
