import type { Appointment, BusinessHour, GalleryItem, ManualBlock, Product, RecurringBooking, Service } from "@prisma/client";

export function toDbDate(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

export function fromDbDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function mapService(service: Service) {
  return {
    ...service,
    price: Number(service.price)
  };
}

export function mapAppointment(appointment: Appointment) {
  return {
    ...appointment,
    date: fromDbDate(appointment.date)
  };
}

export function mapManualBlock(block: ManualBlock) {
  return {
    ...block,
    date: fromDbDate(block.date)
  };
}

export function mapClosedDate(item: { date: Date; reason: string | null }) {
  return {
    date: fromDbDate(item.date),
    reason: item.reason ?? undefined
  };
}

export function mapBusinessHours(items: BusinessHour[]) {
  const hours: Record<number, { open: string; close: string } | null> = {};
  for (let weekday = 0; weekday <= 6; weekday += 1) {
    const item = items.find((candidate) => candidate.weekday === weekday);
    hours[weekday] = item?.open && item.close ? { open: item.open, close: item.close } : null;
  }
  return hours;
}

export function mapProduct(product: Product) {
  return {
    ...product,
    image: product.image ?? undefined,
    description: product.description ?? undefined,
    price: Number(product.price)
  };
}

export function mapGalleryItem(item: GalleryItem) {
  return item;
}

export function mapRecurringBooking(item: RecurringBooking) {
  return item;
}
