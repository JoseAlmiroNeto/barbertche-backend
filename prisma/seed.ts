import { AppointmentSource, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.businessHour.createMany({
    data: [
      { weekday: 0, open: null, close: null },
      { weekday: 1, open: "09:00", close: "19:00" },
      { weekday: 2, open: "09:00", close: "19:00" },
      { weekday: 3, open: "09:00", close: "19:00" },
      { weekday: 4, open: "09:00", close: "19:00" },
      { weekday: 5, open: "09:00", close: "19:00" },
      { weekday: 6, open: "09:00", close: "17:00" }
    ],
    skipDuplicates: true
  });

  const [mateus, joao] = await Promise.all([
    prisma.client.upsert({
      where: { id: "seed-client-mateus" },
      update: {},
      create: { id: "seed-client-mateus", name: "Mateus Silva", phone: "(51) 99990-1000" }
    }),
    prisma.client.upsert({
      where: { id: "seed-client-joao" },
      update: {},
      create: { id: "seed-client-joao", name: "Joao Martins", phone: "(51) 98888-2020" }
    })
  ]);

  const [corte, barba, combo] = await Promise.all([
    prisma.service.upsert({
      where: { id: "seed-service-corte" },
      update: {},
      create: { id: "seed-service-corte", name: "Corte premium", duration: 45, price: 70, active: true }
    }),
    prisma.service.upsert({
      where: { id: "seed-service-barba" },
      update: {},
      create: { id: "seed-service-barba", name: "Barba navalhada", duration: 30, price: 45, active: true }
    }),
    prisma.service.upsert({
      where: { id: "seed-service-combo" },
      update: {},
      create: { id: "seed-service-combo", name: "Cabelo + barba", duration: 75, price: 105, active: true }
    })
  ]);

  await prisma.recurringBooking.upsert({
    where: { id: "seed-recurring-joao" },
    update: {},
    create: {
      id: "seed-recurring-joao",
      clientId: joao.id,
      serviceId: combo.id,
      weekday: 6,
      start: "10:00",
      active: true
    }
  });

  await prisma.product.createMany({
    data: [
      { id: "seed-product-pomada", name: "Pomada matte", price: 59.9, available: true, description: "Fixacao forte, acabamento seco." },
      { id: "seed-product-oleo", name: "Oleo para barba", price: 49.9, available: true, description: "Maciez e brilho com perfume amadeirado." }
    ],
    skipDuplicates: true
  });

  await prisma.appointment.createMany({
    data: [
      {
        id: "seed-appointment-mateus",
        date: nextDate(1),
        start: "09:30",
        end: "10:15",
        clientId: mateus.id,
        clientName: mateus.name,
        serviceId: corte.id,
        source: AppointmentSource.app
      },
      {
        id: "seed-appointment-balcao",
        date: nextDate(1),
        start: "14:00",
        end: "15:15",
        clientName: "Cliente balcao",
        serviceId: combo.id,
        source: AppointmentSource.manual
      }
    ],
    skipDuplicates: true
  });

  await prisma.galleryItem.createMany({
    data: [
      {
        id: "seed-gallery-fade",
        title: "Fade baixo texturizado",
        image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=80"
      },
      {
        id: "seed-gallery-barba",
        title: "Barba marcada",
        image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80"
      }
    ],
    skipDuplicates: true
  });

  void barba;
}

function nextDate(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  return date;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
