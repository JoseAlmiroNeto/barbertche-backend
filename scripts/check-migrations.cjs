const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const migrations = await prisma.$queryRawUnsafe(`
    SELECT migration_name, started_at, finished_at, rolled_back_at
    FROM _prisma_migrations
    ORDER BY started_at
  `);

  console.log(JSON.stringify(migrations, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
