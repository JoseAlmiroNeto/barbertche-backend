import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

export type UploadedImageFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

type UploadResult = {
  path: string;
  url: string;
};

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  async uploadImage(file: UploadedImageFile, folder = "uploads"): Promise<UploadResult> {
    if (!file.mimetype.startsWith("image/")) {
      throw new BadRequestException("Envie apenas arquivos de imagem.");
    }

    const supabaseUrl = this.normalizeSupabaseUrl(
      this.config.get<string>("SUPABASE_URL"),
    );
    const serviceKey = this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY");
    const bucket = this.config.get<string>("SUPABASE_STORAGE_BUCKET") ?? "barbertche-images";

    if (!supabaseUrl || !serviceKey) {
      throw new InternalServerErrorException("Storage de imagens nao configurado no servidor.");
    }

    const storagePath = `${this.cleanFolder(folder)}/${randomUUID()}${this.getExtension(file)}`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Cache-Control": "3600",
        "Content-Type": file.mimetype,
        "x-upsert": "false"
      },
      body: file.buffer as unknown as BodyInit
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new BadRequestException(message || "Nao foi possivel enviar a imagem para o storage.");
    }

    return {
      path: storagePath,
      url: `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`
    };
  }

  private normalizeSupabaseUrl(url?: string) {
    return url
      ?.trim()
      .replace(/\/+$/, "")
      .replace(/\/rest\/v1$/i, "");
  }

  private cleanFolder(folder: string) {
    const cleaned = folder
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9/_-]/g, "-")
      .replace(/\/+/g, "/")
      .replace(/^\/+|\/+$/g, "");

    return cleaned || "uploads";
  }

  private getExtension(file: UploadedImageFile) {
    const extension = extname(file.originalname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
      return extension;
    }

    if (file.mimetype === "image/png") {
      return ".png";
    }

    if (file.mimetype === "image/webp") {
      return ".webp";
    }

    return ".jpg";
  }
}

