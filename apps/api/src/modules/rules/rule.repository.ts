import { prisma } from '../../lib/prisma.js';
import type { Prisma } from '@prisma/client';

export const ruleRepository = {
  async listByUser(userId: string) {
    return prisma.sceneRule.findMany({
      where: { userId },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    });
  },

  async findById(id: string) {
    return prisma.sceneRule.findUnique({ where: { id } });
  },

  async create(data: Prisma.SceneRuleCreateInput) {
    return prisma.sceneRule.create({ data });
  },

  async update(id: string, data: Prisma.SceneRuleUpdateInput) {
    return prisma.sceneRule.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.sceneRule.delete({ where: { id } });
  },

  async findUpdatedSince(userId: string, since: Date) {
    return prisma.sceneRule.findMany({ where: { userId, updatedAt: { gt: since } } });
  },
};