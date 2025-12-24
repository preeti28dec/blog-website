import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-helpers";

const categorySchema = z.object({
  name: z.string().min(1),
});

// PUT update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and role
    const authResult = await requireAdmin();
    if (!authResult.authorized) {
      return authResult.error;
    }

    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if another category with the same name or slug exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        AND: [
          { id: { not: params.id } },
          {
            OR: [
              { name: validatedData.name },
              { slug: slug },
            ],
          },
        ],
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: {
        id: params.id,
      },
      data: {
        name: validatedData.name,
        slug,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and role
    const authResult = await requireAdmin();
    if (!authResult.authorized) {
      return authResult.error;
    }

    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check if category has posts
    if (category._count.posts > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with existing posts" },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}


