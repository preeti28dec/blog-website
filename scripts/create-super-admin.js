/**
 * Simple script to create super admin
 * Run with: node scripts/create-super-admin.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating Super Admin...\n");

  // Default Super Admin credentials
  const defaultSuperAdmin = {
    email: "superadmin@admin.com",
    password: "superadmin123",
    name: "Super Admin",
    role: "SUPER_ADMIN",
  };

  try {
    // Check if super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (existingSuperAdmin) {
      console.log("⚠️  Super Admin already exists!");
      console.log("📧 Email:", existingSuperAdmin.email);
      console.log("💡 If you forgot the password, you can reset it through the database.\n");
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

    console.log("✅ Super Admin created successfully!\n");
    console.log("📧 Email:", defaultSuperAdmin.email);
    console.log("🔑 Password:", defaultSuperAdmin.password);
    console.log("\n⚠️  IMPORTANT: Please change the password after first login!\n");
  } catch (error) {
    console.error("❌ Error creating super admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


