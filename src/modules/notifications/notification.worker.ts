import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { NotificationQueueService } from "./notification-queue.service";

@Injectable()
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);
  private processingJobs = false;
  private processingReceipts = false;

  constructor(private readonly queue: NotificationQueueService) {}

  @Interval("notification-jobs", 15_000)
  async processJobs() {
    if (this.processingJobs) return;
    this.processingJobs = true;
    try { await this.queue.processDueJobs(); }
    catch (error) { this.logger.error("Falha ao processar fila de notificações.", error instanceof Error ? error.stack : String(error)); }
    finally { this.processingJobs = false; }
  }

  @Interval("notification-receipts", 60_000)
  async processReceipts() {
    if (this.processingReceipts) return;
    this.processingReceipts = true;
    try { await this.queue.processDueReceipts(); }
    catch (error) { this.logger.error("Falha ao consultar receipts da Expo.", error instanceof Error ? error.stack : String(error)); }
    finally { this.processingReceipts = false; }
  }
}
