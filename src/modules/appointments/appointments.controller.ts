import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { CreateRecurringBookingDto } from "./dto/create-recurring-booking.dto";
import { RescheduleAppointmentDto } from "./dto/reschedule-appointment.dto";

@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(@Query("date") date?: string) {
    return this.appointmentsService.findAll(date);
  }

  @Get("availability")
  getAvailability(@Query("date") date: string, @Query("serviceId") serviceId: string) {
    return this.appointmentsService.getAvailability(date, serviceId);
  }

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Patch(":id/reschedule")
  reschedule(@Param("id") id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentsService.reschedule(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.appointmentsService.remove(id);
  }

  @Get("recurring")
  findRecurring() {
    return this.appointmentsService.findRecurring();
  }

  @Post("recurring")
  createRecurring(@Body() dto: CreateRecurringBookingDto) {
    return this.appointmentsService.createRecurring(dto);
  }

  @Patch("recurring/:id")
  updateRecurring(@Param("id") id: string, @Body() dto: CreateRecurringBookingDto) {
    return this.appointmentsService.updateRecurring(id, dto);
  }

  @Delete("recurring/:id")
  removeRecurring(@Param("id") id: string) {
    return this.appointmentsService.removeRecurring(id);
  }
}
