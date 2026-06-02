import { prisma } from "./config/database.js";

async function main() {
  try {
    const allColumns = await prisma.$queryRaw<any[]>`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'neon_auth'
      ORDER BY table_name, ordinal_position;
    `;
    console.log("All columns in 'neon_auth' tables:");
    console.table(allColumns);
  } catch (error) {
    console.error("Error querying table columns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
