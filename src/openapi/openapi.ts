import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("BarberTchê API")
    .setDescription("Contrato HTTP do backend BarberTchê.")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupOpenApi(app: INestApplication) {
  const document = createOpenApiDocument(app);
  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/openapi.json",
  });
}
