import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  published: z.boolean().default(false),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  imageUrls: z.array(z.string()).optional(),
  images: z.array(z.object({
    url: z.string(),
    caption: z.string().optional(),
    alignment: z.enum(['left', 'right', 'center', 'full']).optional(),
    isFeatured: z.boolean().optional(),
    source: z.string().optional(),
  })).optional(),
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

    // Validate authorId is a valid MongoDB ObjectId
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!authResult.user.id || !objectIdRegex.test(authResult.user.id)) {
      return NextResponse.json(
        { error: "Invalid author ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Remove slug and authorId from body if present - we always generate slug from title and use authenticated user's ID
    const { slug: _, authorId: __, ...bodyWithoutSlugAndAuthorId } = body;
    
    const validatedData = postSchema.parse(bodyWithoutSlugAndAuthorId);

    // Validate required fields before creating post
    const titleValue = validatedData.title?.trim() || "";
    const contentValue = validatedData.content?.trim() || "";
    
    if (!titleValue || titleValue.length === 0) {
      return NextResponse.json(
        { error: "Title is required and cannot be empty" },
        { status: 400 }
      );
    }
    
    if (!contentValue || contentValue.length === 0) {
      return NextResponse.json(
        { error: "Content is required and cannot be empty" },
        { status: 400 }
      );
    }

    // Generate slug from title and ensure uniqueness
    // Always generate slug from title - never use slug from request body
    let baseSlug = titleValue
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    
    // Ensure slug is not empty - if title doesn't generate valid slug, use timestamp
    if (!baseSlug || baseSlug.trim() === '') {
      baseSlug = `post-${Date.now()}`;
    }
    
    // Check if slug exists and make it unique
    let slug = baseSlug.trim();
    let counter = 1;
    while (await prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Final safety check - ensure slug is never empty
    if (!slug || slug.trim() === '') {
      slug = `post-${Date.now()}`;
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
      title: titleValue,
      content: contentValue,
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
    
    // Handle images: prioritize images array (has metadata), then imageUrls, then imageUrl
    if (validatedData.images && Array.isArray(validatedData.images) && validatedData.images.length > 0) {
      // Process images array with metadata (primary source)
      const formattedImages = validatedData.images
        .filter((img: any) => img && typeof img === 'object' && img.url) // Filter out null/undefined/invalid objects
        .map((img: any) => ({
          url: String(img.url || ''),
          caption: String(img.caption || ''),
          alignment: img.alignment && ['left', 'right', 'center', 'full'].includes(img.alignment) 
            ? img.alignment 
            : 'left',
          isFeatured: Boolean(img.isFeatured),
          source: String(img.source || ''),
        }))
        .filter((img: any) => img.url && img.url.trim() !== ''); // Only include images with valid URLs
      
      if (formattedImages.length > 0) {
        // Store formatted images array
        postData.images = formattedImages;
        
        // Build imageUrls array: start with URLs from images array
        const imageUrlsFromImages = formattedImages.map((img: any) => img.url);
        
        // Merge with provided imageUrls if they exist (add any additional URLs not in images array)
        if (validatedData.imageUrls && Array.isArray(validatedData.imageUrls)) {
          const additionalUrls = validatedData.imageUrls
            .filter((url: any): url is string => 
              url !== null && 
              url !== undefined && 
              typeof url === 'string' && 
              url.trim() !== '' &&
              !imageUrlsFromImages.includes(url.trim())
            );
          postData.imageUrls = [...imageUrlsFromImages, ...additionalUrls];
        } else {
          postData.imageUrls = imageUrlsFromImages;
        }
        
        // Set imageUrl: use provided imageUrl if it exists, otherwise use featured image or first image
        if (imageUrlValue) {
          postData.imageUrl = imageUrlValue;
        } else {
          const featuredImage = formattedImages.find((img: any) => img.isFeatured) || formattedImages[0];
          if (featuredImage && featuredImage.url) {
            postData.imageUrl = String(featuredImage.url);
          }
        }
      } else {
        // If images array is invalid, fall through to imageUrls/imageUrl handling
        postData.images = null;
        postData.imageUrls = [];
      }
    }
    
    // If images array wasn't provided or was invalid, handle imageUrls and imageUrl
    if (!postData.images) {
      if (validatedData.imageUrls && Array.isArray(validatedData.imageUrls) && validatedData.imageUrls.length > 0) {
        // Clean the array: filter out empty strings, null, undefined, and non-string values
        const filteredUrls = validatedData.imageUrls
          .filter((url: any): url is string => 
            url !== null && 
            url !== undefined && 
            typeof url === 'string' && 
            url.trim() !== '' &&
            url !== ','
          );
        if (filteredUrls.length > 0) {
          postData.imageUrls = filteredUrls;
          // Set imageUrl from provided imageUrl or first imageUrl
          postData.imageUrl = imageUrlValue || filteredUrls[0];
        } else {
          postData.imageUrls = [];
          postData.imageUrl = imageUrlValue;
        }
      } else {
        // No imageUrls array, just use imageUrl if provided
        postData.imageUrls = [];
        postData.imageUrl = imageUrlValue;
      }
    }
    
    if (validatedData.creatorName && validatedData.creatorName.trim() !== "") {
      postData.creatorName = validatedData.creatorName.trim();
    }

    // Ensure slug is not empty (shouldn't happen, but safety check)
    // Always regenerate slug from title if it's somehow empty
    if (!postData.slug || postData.slug.trim() === '') {
      const fallbackSlug = titleValue
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || `post-${Date.now()}`;
      postData.slug = fallbackSlug;
    }
    
    // Final validation - ensure slug is a valid non-empty string
    postData.slug = postData.slug.trim();
    if (postData.slug === '') {
      postData.slug = `post-${Date.now()}`;
    }
    
    // Validate authorId exists and is valid ObjectId format
    if (!postData.authorId || typeof postData.authorId !== 'string' || !objectIdRegex.test(postData.authorId)) {
      return NextResponse.json(
        { error: "Author ID is required and must be a valid ObjectId" },
        { status: 400 }
      );
    }
    
    // Verify author exists in database
    try {
      const authorExists = await prisma.user.findUnique({
        where: { id: postData.authorId }
      });
      if (!authorExists) {
        return NextResponse.json(
          { error: "Author not found. Please ensure you are logged in." },
          { status: 400 }
        );
      }
    } catch (err) {
      console.warn('Error verifying author:', err);
      // Continue anyway - the foreign key constraint will catch it if needed
    }

    // Remove any undefined values from postData before sending to Prisma
    // Also filter out any fields that don't exist in the Prisma schema
    const validPrismaFields = [
      'title', 'slug', 'content', 'excerpt', 'published', 'authorId', 
      'categoryId', 'tags', 'imageUrl', 'imageUrls', 'images', 
      'creatorName', 'editToken', 'views'
    ];
    
    const cleanPostData: any = {};
    Object.keys(postData).forEach(key => {
      if (postData[key] !== undefined && validPrismaFields.includes(key)) {
        // Special handling for array fields to ensure they're valid
        if (key === 'imageUrls') {
          // Ensure imageUrls is always a valid array of strings
          if (Array.isArray(postData[key])) {
            cleanPostData[key] = postData[key]
              .filter((url: any) => 
                url !== null && 
                url !== undefined && 
                typeof url === 'string' && 
                url.trim() !== '' &&
                url !== ','
              );
          } else {
            cleanPostData[key] = [];
          }
        } else if (key === 'images') {
          // Ensure images is either null or a valid array
          if (postData[key] === null || postData[key] === undefined) {
            cleanPostData[key] = null;
          } else if (Array.isArray(postData[key])) {
            // Validate that it's an array of objects with at least a url property
            const validImages = postData[key]
              .filter((img: any) => img && typeof img === 'object' && img.url)
              .map((img: any) => ({
                url: String(img.url || ''),
                caption: String(img.caption || ''),
                alignment: img.alignment && ['left', 'right', 'center', 'full'].includes(img.alignment) 
                  ? img.alignment 
                  : 'left',
                isFeatured: Boolean(img.isFeatured),
                source: String(img.source || ''),
              }))
              .filter((img: any) => img.url && img.url.trim() !== '');
            cleanPostData[key] = validImages.length > 0 ? validImages : null;
          } else {
            cleanPostData[key] = null;
          }
        } else {
          cleanPostData[key] = postData[key];
        }
      }
    });
    
    // Ensure imageUrls is always an array (default to empty array if not set)
    // Prisma expects String[] type, so it must be an array, never null
    if (!cleanPostData.imageUrls || !Array.isArray(cleanPostData.imageUrls)) {
      cleanPostData.imageUrls = [];
    } else {
      // Final cleanup: ensure all elements are valid strings
      cleanPostData.imageUrls = cleanPostData.imageUrls
        .filter((url: any) => 
          url !== null && 
          url !== undefined && 
          typeof url === 'string' && 
          url.trim() !== '' &&
          url !== ','
        );
    }
    
    // Ensure images is either null or a valid array (default to null if not set or invalid)
    // Prisma expects Json? type, so it can be null or a valid JSON-serializable array
    if (cleanPostData.images !== null && cleanPostData.images !== undefined) {
      if (!Array.isArray(cleanPostData.images) || cleanPostData.images.length === 0) {
        cleanPostData.images = null;
      } else {
        // Final validation: ensure it's a valid array of objects
        const validImages = cleanPostData.images
          .filter((img: any) => img && typeof img === 'object' && img.url)
          .map((img: any) => ({
            url: String(img.url || ''),
            caption: String(img.caption || ''),
            alignment: img.alignment && ['left', 'right', 'center', 'full'].includes(img.alignment) 
              ? img.alignment 
              : 'left',
            isFeatured: Boolean(img.isFeatured),
            source: String(img.source || ''),
          }))
          .filter((img: any) => img.url && img.url.trim() !== '');
        cleanPostData.images = validImages.length > 0 ? validImages : null;
      }
    } else {
      cleanPostData.images = null;
    }

    // Final validation: Ensure all required Prisma fields are present and valid
    if (!cleanPostData.title || typeof cleanPostData.title !== 'string' || cleanPostData.title.trim() === '') {
      return NextResponse.json(
        { error: "Title is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    
    if (!cleanPostData.content || typeof cleanPostData.content !== 'string' || cleanPostData.content.trim() === '') {
      return NextResponse.json(
        { error: "Content is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    
    if (!cleanPostData.slug || typeof cleanPostData.slug !== 'string' || cleanPostData.slug.trim() === '') {
      return NextResponse.json(
        { error: "Slug is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    
    // Ensure boolean fields are actual booleans
    if (typeof cleanPostData.published !== 'boolean') {
      cleanPostData.published = Boolean(cleanPostData.published);
    }
    
    // Ensure tags is a string
    if (typeof cleanPostData.tags !== 'string') {
      cleanPostData.tags = String(cleanPostData.tags || '');
    }
    
    // Ensure authorId is always set from authenticated user and is valid
    // Since we have an authenticated user, we should always have a valid authorId
    if (authResult.user?.id && objectIdRegex.test(authResult.user.id)) {
      cleanPostData.authorId = authResult.user.id;
    } else if (cleanPostData.authorId && (!objectIdRegex.test(cleanPostData.authorId))) {
      // If authorId is invalid, remove it (it's optional in schema)
      delete cleanPostData.authorId;
    }

    // Final safety check - ensure slug is present and valid before Prisma call
    if (!cleanPostData.slug || typeof cleanPostData.slug !== 'string' || cleanPostData.slug.trim() === '') {
      // Regenerate slug from title as last resort
      const emergencySlug = cleanPostData.title
        ? cleanPostData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `post-${Date.now()}`
        : `post-${Date.now()}`;
      cleanPostData.slug = emergencySlug;
    }
    
    // Trim slug one more time
    cleanPostData.slug = cleanPostData.slug.trim();
    
    // Final validation before Prisma call - ensure all required fields are present and valid
    const validationErrors: string[] = [];
    
    if (!cleanPostData.title || typeof cleanPostData.title !== 'string' || cleanPostData.title.trim() === '') {
      validationErrors.push('Title is required and must be a non-empty string');
    }
    
    if (!cleanPostData.content || typeof cleanPostData.content !== 'string' || cleanPostData.content.trim() === '') {
      validationErrors.push('Content is required and must be a non-empty string');
    }
    
    if (!cleanPostData.slug || typeof cleanPostData.slug !== 'string' || cleanPostData.slug.trim() === '') {
      validationErrors.push('Slug is required and must be a non-empty string');
    }
    
    if (cleanPostData.authorId && !objectIdRegex.test(cleanPostData.authorId)) {
      validationErrors.push('AuthorId must be a valid MongoDB ObjectId');
    }
    
    if (cleanPostData.categoryId && !objectIdRegex.test(cleanPostData.categoryId)) {
      validationErrors.push('CategoryId must be a valid MongoDB ObjectId');
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: "Validation failed before creating post",
          details: validationErrors.join('. '),
          validationErrors: validationErrors
        },
        { status: 400 }
      );
    }
    
    // Final cleanup: Create a new object with only the exact fields Prisma expects
    // This ensures we never accidentally send relation fields or invalid data
    const prismaData: any = {
      title: cleanPostData.title,
      slug: cleanPostData.slug,
      content: cleanPostData.content,
      published: cleanPostData.published ?? false,
      tags: cleanPostData.tags || "",
      editToken: cleanPostData.editToken,
      imageUrls: cleanPostData.imageUrls || [],
    };

    // Add optional fields only if they exist and are valid
    if (cleanPostData.excerpt !== undefined && cleanPostData.excerpt !== null && cleanPostData.excerpt.trim() !== "") {
      prismaData.excerpt = cleanPostData.excerpt.trim();
    }

    if (cleanPostData.authorId && objectIdRegex.test(cleanPostData.authorId)) {
      prismaData.authorId = cleanPostData.authorId;
    }

    if (cleanPostData.categoryId && objectIdRegex.test(cleanPostData.categoryId)) {
      prismaData.categoryId = cleanPostData.categoryId;
    }

    if (cleanPostData.imageUrl !== undefined && cleanPostData.imageUrl !== null && cleanPostData.imageUrl.trim() !== "") {
      prismaData.imageUrl = cleanPostData.imageUrl.trim();
    }

    if (cleanPostData.images !== undefined && cleanPostData.images !== null) {
      prismaData.images = cleanPostData.images;
    }

    if (cleanPostData.creatorName !== undefined && cleanPostData.creatorName !== null && cleanPostData.creatorName.trim() !== "") {
      prismaData.creatorName = cleanPostData.creatorName.trim();
    }

    console.log('Creating post with data:', JSON.stringify(prismaData, null, 2));
    console.log('Post data keys:', Object.keys(prismaData));
    console.log('AuthorId:', prismaData.authorId);
    console.log('Slug value:', prismaData.slug);

    let post;
    try {
      post = await prisma.post.create({
        data: prismaData,
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
    } catch (prismaError: any) {
      // Handle Prisma-specific errors with better messages
      console.error("Prisma error creating post:", {
        code: prismaError?.code,
        message: prismaError?.message,
        meta: prismaError?.meta,
        data: prismaData,
        stack: prismaError?.stack,
      });
      
      // Handle unique constraint violations
      if (prismaError?.code === 'P2002') {
        const targetFields = prismaError.meta?.target || [];
        let errorMessage = "A post with this information already exists.";
        if (targetFields.includes('slug')) {
          errorMessage = "A post with this slug already exists. Please use a different title.";
        } else if (targetFields.includes('editToken')) {
          errorMessage = "Edit token conflict. Please try again.";
        }
        return NextResponse.json(
          { 
            error: errorMessage,
            details: targetFields.length > 0 ? `Duplicate on field(s): ${targetFields.join(', ')}` : undefined
          },
          { status: 409 }
        );
      }
      
      // Handle foreign key constraint violations
      if (prismaError?.code === 'P2003') {
        const fieldName = prismaError.meta?.field_name || 'unknown';
        let errorMessage = "Invalid reference. The referenced record does not exist.";
        if (fieldName.includes('category')) {
          errorMessage = "Invalid category. The selected category does not exist.";
        } else if (fieldName.includes('author')) {
          errorMessage = "Invalid author. Please ensure you are logged in.";
        }
        return NextResponse.json(
          { 
            error: errorMessage,
            details: fieldName !== 'unknown' ? `Field: ${fieldName}` : undefined
          },
          { status: 400 }
        );
      }
      
      // Handle Prisma validation errors
      if (prismaError?.code === 'P2009' || prismaError?.code === 'P2010' || prismaError?.code === 'P2011' || prismaError?.message?.includes('Invalid')) {
        let errorMessage = "Invalid post data. Please check all required fields are provided and valid.";
        let errorDetails = prismaError.message || "Unknown Prisma validation error";
        
        // Try to extract specific field errors
        const unknownArgMatch = prismaError?.message?.match(/Unknown arg `(\w+)`/);
        if (unknownArgMatch) {
          errorMessage = `Invalid field: ${unknownArgMatch[1]}. This field is not allowed in the post schema.`;
        } else {
          // Check for missing required fields
          const missingArgMatch = prismaError?.message?.match(/Argument `(\w+)` is missing/);
          if (missingArgMatch) {
            errorMessage = `Missing required field: ${missingArgMatch[1]}. Please fill in all required fields (title, content).`;
          } else {
            // Check if required fields are actually present in our data
            const requiredFields = ['title', 'slug', 'content'];
            const missingFields = requiredFields.filter(field => {
              const value = prismaData[field];
              return !value || (typeof value === 'string' && value.trim() === '');
            });
            
            if (missingFields.length > 0) {
              errorMessage = `Missing required fields: ${missingFields.join(', ')}. Please ensure all required fields are filled.`;
            } else {
              // Try to extract more specific error from Prisma message
              const typeErrorMatch = prismaError?.message?.match(/Argument `(\w+)`: Expected (\w+). Received (\w+)/);
              if (typeErrorMatch) {
                errorMessage = `Invalid type for field "${typeErrorMatch[1]}": expected ${typeErrorMatch[2]}, received ${typeErrorMatch[3]}.`;
              }
            }
          }
        }
        
        // Return error response
        const errorResponse: any = {
          error: errorMessage,
          details: errorDetails,
        };
        
        // Include additional debugging info in development
        if (process.env.NODE_ENV === "development") {
          errorResponse.fullError = prismaError.message;
          errorResponse.prismaCode = prismaError?.code;
          errorResponse.dataSent = prismaData;
        }
        
        return NextResponse.json(
          errorResponse,
          { status: 400 }
        );
      }
      
      // Handle other Prisma errors
      if (prismaError?.code) {
        return NextResponse.json(
          { 
            error: "Database error occurred while creating post. Please try again.",
            details: process.env.NODE_ENV === "development" ? prismaError.message : undefined,
            prismaCode: prismaError.code
          },
          { status: 500 }
        );
      }
      
      // Re-throw to be caught by outer catch block
      throw prismaError;
    }

    // Return post with edit token so user can save it
    return NextResponse.json({ ...post, editToken }, { status: 201 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }
    
    // Check if this is a Prisma error that escaped the inner catch
    if (error && typeof error === 'object') {
      const prismaError = error as any;
      
      // Handle Prisma errors that weren't caught in the inner try-catch
      if (prismaError.code) {
        console.error("Prisma error (outer catch):", {
          code: prismaError.code,
          message: prismaError.message,
          meta: prismaError.meta,
        });
        
        // Return appropriate error response
        if (prismaError.code === 'P2002') {
          return NextResponse.json(
            { 
              error: "A post with this slug or edit token already exists. Please use a different title.",
            },
            { status: 409 }
          );
        }
        
        if (prismaError.code === 'P2003') {
          return NextResponse.json(
            { 
              error: "Invalid reference. The category or author does not exist.",
            },
            { status: 400 }
          );
        }
        
        if (prismaError.code === 'P2009' || prismaError.code === 'P2010' || prismaError.code === 'P2011') {
          let errorMessage = "Invalid post data. Please check all required fields are provided and valid.";
          
          // Try to extract specific error details
          if (prismaError.message?.includes('Unknown arg')) {
            const fieldMatch = prismaError.message.match(/Unknown arg `(\w+)`/);
            if (fieldMatch) {
              errorMessage = `Invalid field: ${fieldMatch[1]}. This field is not allowed.`;
            }
          } else if (prismaError.message?.includes('Argument') && prismaError.message?.includes('is missing')) {
            const fieldMatch = prismaError.message.match(/Argument `(\w+)` is missing/);
            if (fieldMatch) {
              errorMessage = `Missing required field: ${fieldMatch[1]}. Please fill in all required fields.`;
            }
          }
          
          return NextResponse.json(
            { 
              error: errorMessage,
              details: process.env.NODE_ENV === "development" ? prismaError.message : undefined,
              fullError: process.env.NODE_ENV === "development" ? prismaError.message : undefined,
            },
            { status: 400 }
          );
        }
      }
    }
    
    // Log full error details for debugging
    const errorInfo: any = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    
    // Extract Prisma error details if available
    if (error && typeof error === 'object') {
      const prismaError = error as any;
      errorInfo.code = prismaError.code;
      errorInfo.meta = prismaError.meta;
      
      if (prismaError.message) {
        errorInfo.prismaMessage = prismaError.message;
      }
    }
    
    console.error("Error creating post:", JSON.stringify(errorInfo, null, 2));
    console.error("Error creating post (raw):", error);
    
    // Provide user-friendly error message
    let userMessage = "Failed to create post. Please check your input and try again.";
    let errorDetails: string | undefined = undefined;
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      // Extract readable error from Prisma messages
      if (errorMessage.includes('Invalid `prisma.post.create()')) {
        const match = errorMessage.match(/Invalid `prisma\.post\.create\(\)` invocation:[\s\S]*?\n\n([\s\S]*?)(?:\n\n|$)/);
        if (match && match[1]) {
          errorDetails = match[1].trim();
          // Try to extract field name from error
          const fieldMatch = errorDetails.match(/Unknown arg `(\w+)`/);
          if (fieldMatch) {
            userMessage = `Invalid field: ${fieldMatch[1]}. Please check your post data.`;
          } else {
            // Check if it's a missing required field issue
            if (errorDetails.includes('Argument') && errorDetails.includes('is missing')) {
              const missingFieldMatch = errorDetails.match(/Argument `(\w+)` is missing/);
              if (missingFieldMatch) {
                userMessage = `Missing required field: ${missingFieldMatch[1]}. Please fill in all required fields (title, content).`;
              } else {
                userMessage = "Invalid post data. Please ensure title and content are filled in.";
              }
            } else {
              userMessage = "Invalid post data. Please ensure title and content are filled in.";
            }
          }
        }
      } else if (errorMessage.includes('Record to create not valid')) {
        userMessage = "The post data is invalid. Please check all fields.";
        errorDetails = errorMessage;
      } else if (errorMessage.includes('Unique constraint')) {
        userMessage = "A post with this information already exists. Please use a different title or slug.";
        errorDetails = errorMessage;
      }
    }
    
    // Return error response with full details
    const errorResponse: any = {
      error: userMessage,
    };
    
    // Always include details in development, and include them in production if it's a validation error
    if (process.env.NODE_ENV === "development" || errorDetails) {
      errorResponse.details = errorDetails || (error instanceof Error ? error.message : String(error));
    }
    
    // Include full error message for debugging
    if (error instanceof Error) {
      errorResponse.fullError = process.env.NODE_ENV === "development" ? error.message : undefined;
      
      // Extract Prisma error code if available
      const prismaError = error as any;
      if (prismaError.code) {
        errorResponse.prismaCode = prismaError.code;
      }
      
      // Include stack trace in development
      if (process.env.NODE_ENV === "development" && error.stack) {
        errorResponse.stack = error.stack;
      }
    }
    
    return NextResponse.json(
      errorResponse,
      { status: 500 }
    );
  }
}

