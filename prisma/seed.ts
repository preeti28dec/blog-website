import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Default Super Admin credentials
  const defaultSuperAdmin = {
    email: "superadmin@admin.com",
    password: "superadmin123",
    name: "Super Admin",
    role: "SUPER_ADMIN" as const,
  };

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: defaultSuperAdmin.email },
  });

  if (existingSuperAdmin) {
    console.log("✅ Super Admin already exists");
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(defaultSuperAdmin.password, 10);

  // Create super admin
  const superAdmin = await prisma.user.create({
    data: {
      email: defaultSuperAdmin.email,
      password: hashedPassword,
      name: defaultSuperAdmin.name,
      role: defaultSuperAdmin.role,
    },
  });

  console.log("✅ Default Super Admin created!");
  console.log("📧 Email:", defaultSuperAdmin.email);
  console.log("🔑 Password:", defaultSuperAdmin.password);
  console.log("⚠️  Please change the password after first login!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




