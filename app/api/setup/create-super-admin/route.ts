import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// This endpoint creates the default super admin
// Only works if no super admin exists yet
export async function POST(request: NextRequest) {
  try {
    // Check if any super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        {
          error: "Super Admin already exists",
          message: "Please use the existing super admin account or create a new one through the user management page.",
        },
        { status: 409 }
      );
    }

    // Default Super Admin credentials
    const defaultSuperAdmin = {
      email: "superadmin@admin.com",
      password: "superadmin123",
      name: "Super Admin",
      role: "SUPER_ADMIN" as const,
    };

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
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Super Admin created successfully!",
        credentials: {
          email: defaultSuperAdmin.email,
          password: defaultSuperAdmin.password,
        },
        user: superAdmin,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating super admin:", error);
    return NextResponse.json(
      {
        error: "Failed to create super admin",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if super admin exists
export async function GET() {
  try {
    const superAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (superAdmin) {
      return NextResponse.json({
        exists: true,
        message: "Super Admin already exists",
        user: {
          email: superAdmin.email,
          name: superAdmin.name,
          createdAt: superAdmin.createdAt,
        },
      });
    }

    return NextResponse.json({
      exists: false,
      message: "No Super Admin found. You can create one using POST /api/setup/create-super-admin",
    });
  } catch (error: any) {
    console.error("Error checking super admin:", error);
    return NextResponse.json(
      {
        error: "Failed to check super admin",
        details: error.message,
      },
      { status: 500 }
    );
  }
}




