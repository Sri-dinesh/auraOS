import { prisma } from '../../lib/prisma.js';

export type PresetVisibility = 'PRIVATE' | 'BUILTIN' | 'PUBLIC' | 'UNLISTED';

export const presetRepository = {
  async list(visibility: PresetVisibility) {
    return prisma.preset.findMany({
      where: { visibility },
      orderBy: [{ downloads: 'desc' }, { likes: 'desc' }],
      select: {
        id: true,
        authorId: true,
        name: true,
        description: true,
        thumbnailUrl: true,
        downloads: true,
        likes: true,
        visibility: true,
      },
    });
  },

  async findById(id: string) {
    return prisma.preset.findUnique({ where: { id } });
  },

  async incrementDownloads(id: string) {
    return prisma.preset.update({
      where: { id },
      data: { downloads: { increment: 1 } },
      select: { downloads: true },
    });
  },

  async create(data: {
    authorId: string;
    name: string;
    description?: string;
    sceneConfig: object;
    visibility?: PresetVisibility;
  }) {
    return prisma.preset.create({
      data: {
        author: { connect: { id: data.authorId } },
        name: data.name,
        description: data.description,
        sceneConfig: data.sceneConfig as never,
        visibility: data.visibility ?? 'PRIVATE',
      },
    });
  },
};