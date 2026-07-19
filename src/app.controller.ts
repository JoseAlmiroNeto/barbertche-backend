import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { HealthResponseDto } from "./openapi/api-response.models";
import { Public } from "./security/public.decorator";

@ApiTags("health")
@Controller()
export class AppController {
  @Public()
  @Get("health")
  @ApiOkResponse({ type: HealthResponseDto })
  health() {
    return {
      status: "ok",
      service: "barbertche-back"
    };
  }
}

