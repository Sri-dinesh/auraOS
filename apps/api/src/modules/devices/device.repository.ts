import { prisma } from '../../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export const deviceRepository = {
  async listByUser(userId: string) {
    return prisma.device.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.device.findUnique({ where: { id } });
  },

  async create(data: Prisma.DeviceCreateInput) {
    return prisma.device.create({ data });
  },

  async update(id: string, data: Prisma.DeviceUpdateInput) {
    return prisma.device.update({ where: { id }, data });
  },

  async remove(id: string) {
    return prisma.device.delete({ where: { id } });
  },

  async touch(id: string) {
    return prisma.device.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  },
};