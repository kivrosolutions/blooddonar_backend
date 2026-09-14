import prisma from '../../config/database';
import { ApiError } from '../../utils/ApiError';
import { UpdateUserInput } from './users.schema';

export class UsersService {
  async getAll() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  async update(id: string, data: UpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw ApiError.conflict('Email already in use');
      }
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await prisma.user.delete({ where: { id } });
  }
}
