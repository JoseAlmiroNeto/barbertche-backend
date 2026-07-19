import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";

@Injectable()
export class ExpoPushClient {
  private readonly expo: Expo;

  constructor(config: ConfigService) {
    const accessToken = config.get<string>("EXPO_ACCESS_TOKEN")?.trim();
    this.expo = new Expo(accessToken ? { accessToken } : undefined);
  }

  isValidToken(token: string) {
    return Expo.isExpoPushToken(token);
  }

  chunks(messages: ExpoPushMessage[]) {
    return this.expo.chunkPushNotifications(messages);
  }

  send(messages: ExpoPushMessage[]) {
    return this.expo.sendPushNotificationsAsync(messages);
  }

  getReceipts(ids: string[]) {
    return this.expo.getPushNotificationReceiptsAsync(ids);
  }
}
