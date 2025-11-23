import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  published: z.boolean().default(false),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  creatorName: z.string().optional(),
});

// Generate a unique edit token
function generateEditToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Enable caching for GET requests
export const revalidate = 60;

// GET all posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const published = searchParams.get("published");

    const where: any = {};
    if (category) {
      where.category = { slug: category };
    }
    if (published !== null) {
      where.published = published === "true";
    }

    const posts = await prisma.post.findMany({
      where,
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
        _count: {
          select: {
            comments: {
              where: {
                approved: true,
              },
            },
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    const response = NextResponse.json(posts);
    // Add cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST create new post (requires ADMIN or SUPER_ADMIN)
export async function POST(request: NextRequest) {
  try {
    // Check authentication and role
    const { requireAdmin } = await import("@/lib/auth-helpers");
    const authResult = await requireAdmin();
    if (!authResult.authorized) {
      return authResult.error;
    }
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: "Authenticated user not found" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validatedData = postSchema.parse(body);

    // Generate slug from title and ensure uniqueness
    let baseSlug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    // Ensure slug is not empty
    if (!baseSlug) {
      baseSlug = `post-${Date.now()}`;
    }
    
    // Check if slug exists and make it unique
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate edit token for public posts
    const editToken = generateEditToken();

    // Handle imageUrl - accept string, null, or undefined
    let imageUrlValue = null;
    if (validatedData.imageUrl !== null && validatedData.imageUrl !== undefined) {
      const trimmed = validatedData.imageUrl.trim();
      imageUrlValue = trimmed !== "" ? trimmed : null;
    }

    // Handle categoryId - validate ObjectId format if provided, but don't block creation if invalid
    let categoryIdValue: string | undefined = undefined;
    if (validatedData.categoryId && validatedData.categoryId.trim() !== "") {
      const trimmedCategoryId = validatedData.categoryId.trim();
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (objectIdRegex.test(trimmedCategoryId)) {
        // Verify category exists - if it doesn't, just skip it instead of failing
        try {
          const categoryExists = await prisma.category.findUnique({
            where: { id: trimmedCategoryId }
          });
          if (categoryExists) {
            categoryIdValue = trimmedCategoryId;
          }
        } catch (err) {
          // If category lookup fails, just continue without category
          console.warn('Category lookup failed, continuing without category:', err);
        }
      }
    }

    // Build the data object for Prisma - only include fields that are defined
    const postData: any = {
      title: validatedData.title,
      content: validatedData.content,
      slug: slug,
      published: validatedData.published ?? false,
      tags: validatedData.tags || "",
      editToken: editToken,
      authorId: authResult.user.id, // Associate post with logged-in admin
    };

    // Add optional fields only if they have values
    if (validatedData.excerpt && validatedData.excerpt.trim() !== "") {
      postData.excerpt = validatedData.excerpt.trim();
    }
    
    if (categoryIdValue) {
      postData.categoryId = categoryIdValue;
    }
    
    // Include imageUrl if it has a value (can be null or string)
    if (imageUrlValue !== null && imageUrlValue !== undefined) {
      postData.imageUrl = imageUrlValue;
    }
    
    if (validatedData.creatorName && validatedData.creatorName.trim() !== "") {
      postData.creatorName = validatedData.creatorName.trim();
    }

    console.log('Creating post with data:', JSON.stringify(postData, null, 2));

    const post = await prisma.post.create({
      data: postData,
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

    // Return post with edit token so user can save it
    return NextResponse.json({ ...post, editToken }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    // Log full error details
    console.error("Error creating post - Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("Error creating post - Error object:", error);
    
    // Provide more detailed error information
    let errorMessage = "Unknown error";
    let errorCode = null;
    let errorMeta = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Check for Prisma-specific errors
    if (error && typeof error === 'object') {
      const prismaError = error as any;
      errorCode = prismaError.code;
      errorMeta = prismaError.meta;
      
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { 
            error: "A post with this slug or edit token already exists",
            details: prismaError.meta?.target ? `Duplicate on field(s): ${prismaError.meta.target.join(', ')}` : undefined
          },
          { status: 409 }
        );
      }
      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          { 
            error: "Invalid categoryId. Category does not exist.",
            details: prismaError.meta?.field_name ? `Field: ${prismaError.meta.field_name}` : undefined
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create post",
        details: errorMessage,
        code: errorCode,
        meta: process.env.NODE_ENV === "development" ? errorMeta : undefined
      },
      { status: 500 }
    );
  }
}

