import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminName = process.env.SEED_ADMIN_NAME;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn("⚠️ SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set. Skipping admin seed.");
  } else {
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingAdmin) {
      console.log(`ℹ️ Admin user ${adminEmail} already exists.`);
    } else {
      const hashedPassword = await argon2.hash(adminPassword);
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: adminName || 'Admin',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
        }
      });
      console.log(`✅ Admin user ${adminEmail} created.`);
    }
  }

  // Idempotent Categories
  const categories = [
    { name: "Carbide Inserts", slug: "carbide-inserts", description: "Precision inserts" },
    { name: "Machine Tools & Accessories", slug: "machine-tools", description: "Collets and holders" },
    { name: "Automation & Control", slug: "automation", description: "Sensors and PLCs" }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Categories seeded.");

  // Idempotent Brands
  const brands = [
    { name: "Sandvik", slug: "sandvik", tagline: "Coromant" },
    { name: "Siemens", slug: "siemens", tagline: "Ingenuity for life" },
    { name: "Kennametal", slug: "kennametal", tagline: "Engineering" }
  ];

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: brand,
    });
  }
  console.log("✅ Brands seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
