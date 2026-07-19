import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiTags } from "@nestjs/swagger";
import {
  AppointmentResponseDto,
  DeletedResponseDto,
  MyAppointmentsResponseDto,
  RecurringBookingResponseDto,
} from "../../openapi/api-response.models";
import { CurrentUser } from "../../security/current-user.decorator";
import { Public } from "../../security/public.decorator";
import { Roles } from "../../security/roles.decorator";
import type { AuthenticatedUser } from "../../security/auth.types";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { CreateRecurringBookingDto } from "./dto/create-recurring-booking.dto";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";
import { UpdateAppointmentStatusDto } from "./dto/update-appointment-status.dto";

@ApiTags("appointments")
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  @ApiBearerAuth()
  @ApiQuery({ name: "date", required: false, format: "date" })
  @ApiOkResponse({ type: [AppointmentResponseDto] })
  findAll(@Query("date") date?: string) {
    return this.appointmentsService.findAll(date);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOkResponse({ type: MyAppointmentsResponseDto })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findMine(user);
  }

  @Public()
  @Get("availability")
  @ApiQuery({ name: "date", required: true, format: "date" })
  @ApiQuery({ name: "serviceId", required: true })
  @ApiOkResponse({ schema: { type: "array", items: { type: "string", example: "09:00" } } })
  getAvailability(
    @Query("date") date: string,
    @Query("serviceId") serviceId: string,
  ) {
    return this.appointmentsService.getAvailability(date, serviceId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: AppointmentResponseDto })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.create(dto, user);
  }

  @Patch(":id/reschedule")
  @ApiBearerAuth()
  @ApiOkResponse({ type: AppointmentResponseDto })
  reschedule(
    @Param("id") id: string,
    @Body() dto: RescheduleAppointmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.reschedule(id, dto, user);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: AppointmentResponseDto })
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.remove(id, user);
  }

  @Roles(UserRole.ADMIN)
  @Patch(":id/status")
  @ApiBearerAuth()
  @ApiOkResponse({ type: AppointmentResponseDto })
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get("recurring")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [RecurringBookingResponseDto] })
  findRecurring() {
    return this.appointmentsService.findRecurring();
  }

  @Roles(UserRole.ADMIN)
  @Post("recurring")
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: RecurringBookingResponseDto })
  createRecurring(@Body() dto: CreateRecurringBookingDto) {
    return this.appointmentsService.createRecurring(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch("recurring/:id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: RecurringBookingResponseDto })
  updateRecurring(
    @Param("id") id: string,
    @Body() dto: CreateRecurringBookingDto,
  ) {
    return this.appointmentsService.updateRecurring(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete("recurring/:id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: DeletedResponseDto })
  removeRecurring(@Param("id") id: string) {
    return this.appointmentsService.removeRecurring(id);
  }
}
