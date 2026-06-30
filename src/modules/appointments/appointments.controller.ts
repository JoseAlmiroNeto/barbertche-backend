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
import { CurrentUser } from "../../security/current-user.decorator";
import { Public } from "../../security/public.decorator";
import { Roles } from "../../security/roles.decorator";
import type { AuthenticatedUser } from "../../security/auth.types";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { CreateRecurringBookingDto } from "./dto/create-recurring-booking.dto";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";

@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query("date") date?: string) {
    return this.appointmentsService.findAll(date);
  }

  @Get("me")
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.findMine(user);
  }

  @Public()
  @Get("availability")
  getAvailability(
    @Query("date") date: string,
    @Query("serviceId") serviceId: string,
  ) {
    return this.appointmentsService.getAvailability(date, serviceId);
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.create(dto, user);
  }

  @Patch(":id/reschedule")
  reschedule(
    @Param("id") id: string,
    @Body() dto: RescheduleAppointmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.appointmentsService.reschedule(id, dto, user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.appointmentsService.remove(id, user);
  }

  @Roles(UserRole.ADMIN)
  @Get("recurring")
  findRecurring() {
    return this.appointmentsService.findRecurring();
  }

  @Roles(UserRole.ADMIN)
  @Post("recurring")
  createRecurring(@Body() dto: CreateRecurringBookingDto) {
    return this.appointmentsService.createRecurring(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch("recurring/:id")
  updateRecurring(
    @Param("id") id: string,
    @Body() dto: CreateRecurringBookingDto,
  ) {
    return this.appointmentsService.updateRecurring(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete("recurring/:id")
  removeRecurring(@Param("id") id: string) {
    return this.appointmentsService.removeRecurring(id);
  }
}
