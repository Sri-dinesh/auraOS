import { deviceRepository } from './device.repository.js';
import { AppError } from '../../lib/errors.js';
import { deviceRegistrationSchema, type DeviceRegistrationPayload } from '@auraos/validation';

export const deviceService = {
  async list(userId: string) {
    return deviceRepository.listByUser(userId);
  },

  async register(userId: string, input: unknown) {
    const parsed = deviceRegistrationSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid device payload', 400, {
        issues: parsed.error.flatten().fieldErrors,
      });
    }
    const data = parsed.data as DeviceRegistrationPayload;

    // A device re-registering from the same host updates in place rather than
    // creating a duplicate row on every launch.
    const existing = (await deviceRepository.listByUser(userId)).find(
      (d) =>
        d.deviceName === data.deviceName &&
        d.platform === data.platform &&
        d.osVersion === data.osVersion,
    );

    if (existing) {
      return deviceRepository.update(existing.id, {
        appVersion: data.appVersion,
        architecture: data.architecture,
        lastSeenAt: new Date(),
      });
    }

    return deviceRepository.create({
      user: { connect: { id: userId } },
      deviceName: data.deviceName,
      platform: data.platform,
      architecture: data.architecture,
      osVersion: data.osVersion,
      appVersion: data.appVersion,
    });
  },

  async update(userId: string, id: string, deviceName?: string) {
    await this.assertOwnership(userId, id);
    return deviceRepository.update(id, { deviceName });
  },

  async remove(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    await deviceRepository.remove(id);
  },

  async assertOwnership(userId: string, id: string) {
    const device = await deviceRepository.findById(id);
    if (!device) throw new AppError('NOT_FOUND', 'Device not found', 404);
    if (device.userId !== userId) {
      throw new AppError('FORBIDDEN', 'Device belongs to another user', 403);
    }
    return device;
  },
};