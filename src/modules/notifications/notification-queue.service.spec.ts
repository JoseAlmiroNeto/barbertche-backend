import { NotificationCategory, NotificationJobStatus } from "@prisma/client";
import { NotificationQueueService } from "./notification-queue.service";

jest.mock("expo-server-sdk", () => ({ Expo: class Expo {} }));

function buildJob() {
  return {
    id: "job-1", userId: "user-1", category: NotificationCategory.APPOINTMENT_CHANGES,
    title: "Título", body: "Mensagem", data: null, status: NotificationJobStatus.PENDING,
    attempts: 0, maxAttempts: 3,
    user: { active: true, notificationPreference: null, pushTokens: [{ token: "ExponentPushToken[valid]" }] },
  };
}

function buildPrisma(job = buildJob()) {
  return {
    notificationJob: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockResolvedValue([job]),
      update: jest.fn().mockResolvedValue({}),
    },
    notificationReceipt: { upsert: jest.fn(), findMany: jest.fn() },
    pushToken: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
  } as any;
}

describe("NotificationQueueService", () => {
  it("remove o token quando o ticket retorna DeviceNotRegistered", async () => {
    const prisma = buildPrisma();
    const expo = {
      isValidToken: jest.fn().mockReturnValue(true), chunks: jest.fn((messages) => [messages]),
      send: jest.fn().mockResolvedValue([{ status: "error", message: "gone", details: { error: "DeviceNotRegistered" } }]),
    } as any;
    await new NotificationQueueService(prisma, expo).processDueJobs();
    expect(prisma.pushToken.deleteMany).toHaveBeenCalledWith({ where: { token: { in: ["ExponentPushToken[valid]"] } } });
  });

  it("reagenda com backoff quando o envio falha", async () => {
    const prisma = buildPrisma();
    const expo = {
      isValidToken: jest.fn().mockReturnValue(true), chunks: jest.fn((messages) => [messages]),
      send: jest.fn().mockRejectedValue(new Error("Expo indisponível")),
    } as any;
    await new NotificationQueueService(prisma, expo).processDueJobs();
    expect(prisma.notificationJob.update).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { id: "job-1" },
      data: expect.objectContaining({ status: NotificationJobStatus.PENDING, lastError: "Expo indisponível", lockedAt: null }),
    }));
  });
});
