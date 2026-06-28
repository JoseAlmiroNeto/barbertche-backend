import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/security/password";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.ADMIN_NAME?.trim() || "Administrador";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const phone = process.env.ADMIN_PHONE?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email) {
    throw new Error("Defina ADMIN_EMAIL no .env.");
  }

  if (!password || password.length < 8) {
    throw new Error(
      "Defina ADMIN_PASSWORD no .env com pelo menos 8 caracteres.",
    );
  }

  const admin = await prisma.user.upsert({
    where: { email },
    create: {
      name,
      email,
      phone,
      passwordHash: hashPassword(password),
      role: UserRole.ADMIN,
      active: true,
    },
    update: {
      name,
      phone,
      passwordHash: hashPassword(password),
      role: UserRole.ADMIN,
      active: true,
    },
  });

  console.log(`Admin pronto: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
