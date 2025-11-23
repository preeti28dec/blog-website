import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  published: z.boolean().optional(),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  editToken: z.string().optional(), // No longer required, kept for backward compatibility
});

// GET single post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: {
        slug: params.slug,
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Note: View count is now handled separately via /api/posts/[slug]/views endpoint
    // This prevents auto-incrementing on every GET request

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PUT update post (requires ADMIN or SUPER_ADMIN)
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Check authentication and role
    const { requireAdmin } = await import("@/lib/auth-helpers");
    const authResult = await requireAdmin();
    if (!authResult.authorized) {
      return authResult.error;
    }

    const body = await request.json();
    const validatedData = updatePostSchema.parse(body);

    // Get the existing post
    const existingPost = await prisma.post.findUnique({
      where: { slug: params.slug },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Remove editToken from update data (no longer needed)
    const { editToken, ...updateData } = validatedData;

    // Type updateData to allow slug property
    type UpdateData = typeof updateData & { slug?: string };

    // If title is updated, regenerate slug
    if (validatedData.title) {
      (updateData as UpdateData).slug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Handle imageUrl - accept string, null, or undefined
    if (validatedData.imageUrl !== undefined) {
      if (validatedData.imageUrl !== null && validatedData.imageUrl.trim() !== "") {
        updateData.imageUrl = validatedData.imageUrl.trim();
      } else {
        updateData.imageUrl = null;
      }
    }

    console.log('Updating post with data:', updateData); // Debug log

    const post = await prisma.post.update({
      where: {
        slug: params.slug,
      },
      data: updateData,
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE post (requires ADMIN or SUPER_ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Check authentication and role
    const { requireAdmin } = await import("@/lib/auth-helpers");
    const authResult = await requireAdmin();
    if (!authResult.authorized) {
      return authResult.error;
    }

    const post = await prisma.post.findUnique({
      where: { slug: params.slug },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.post.delete({
      where: {
        slug: params.slug,
      },
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

