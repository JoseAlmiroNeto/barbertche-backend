import { NotificationPreferencesService, defaultNotificationPreferences } from "./notification-preferences.service";

describe("NotificationPreferencesService", () => {
  it("retorna padrões seguros quando o usuário ainda não configurou preferências", async () => {
    const prisma = { notificationPreference: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    const service = new NotificationPreferencesService(prisma);
    await expect(service.get("user-1")).resolves.toEqual({ userId: "user-1", ...defaultNotificationPreferences });
  });

  it("persiste apenas os campos enviados", async () => {
    const prisma = { notificationPreference: { upsert: jest.fn().mockResolvedValue({}) } } as any;
    const service = new NotificationPreferencesService(prisma);
    await service.update("user-1", { promotions: true });
    expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: { userId: "user-1", ...defaultNotificationPreferences, promotions: true },
      update: { promotions: true },
    });
  });
});
