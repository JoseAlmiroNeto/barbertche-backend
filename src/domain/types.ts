export type AppointmentSource = "app" | "manual" | "recurring";
export type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELED"
  | "NO_SHOW";

export type Client = {
  id: string;
  name: string;
  phone: string;
};

export type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  active: boolean;
};

export type Appointment = {
  id: string;
  date: string;
  start: string;
  end: string;
  clientId?: string;
  clientName: string;
  serviceId: string;
  source: AppointmentSource;
  status: AppointmentStatus;
  canceledAt?: string | null;
  completedAt?: string | null;
  cancellationReason?: string | null;
};

export type RecurringBooking = {
  id: string;
  clientId: string;
  serviceId: string;
  weekday: number;
  start: string;
  active: boolean;
};

export type ManualBlock = {
  id: string;
  date: string;
  start: string;
  end: string;
  reason: string;
};

export type BusinessHours = Record<number, { open: string; close: string } | null>;

export type ClosedDate = {
  date: string;
  reason?: string;
};

export type Product = {
  id: string;
  name: string;
  image?: string;
  description?: string;
  price: number;
  available: boolean;
};

export type GalleryItem = {
  id: string;
  title: string;
  image: string;
};

export type Interval = {
  start: string;
  end: string;
};
