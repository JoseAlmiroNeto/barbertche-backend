import { Controller, Get } from "@nestjs/common";
import { Public } from "./security/public.decorator";

@Controller()
export class AppController {
  @Public()
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "barbertche-back"
    };
  }
}

