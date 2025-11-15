import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to get client IP
function getClientIp(request: NextRequest): string {
  // Try various headers that might contain the client IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare
  const trueClientIp = request.headers.get("true-client-ip");
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  if (trueClientIp) {
    return trueClientIp.trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  // Fallback: try to get from request URL or use a default
  // In development, this might be "unknown", but we'll handle it
  return "unknown";
}

// GET likes count and check if user has liked
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Decode the slug in case it's URL encoded
    const decodedSlug = decodeURIComponent(params.slug);
    
    const post = await prisma.post.findUnique({
      where: { slug: decodedSlug },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get client IP
    const clientIp = getClientIp(request);
    
    // Get clientId from query parameter (for cases where IP is unknown)
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    
    // Get user email from token if available
    let userEmail: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7);
        const jwt = await import("jsonwebtoken");
        const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "your-secret-key";
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userEmail = decoded.email || null;
      } catch (error) {
        // Token invalid, ignore
      }
    }

    // Get total likes count
    const likesCount = await prisma.like.count({
      where: { postId: post.id },
    });

    // Check if current user/IP/clientId has liked
    // Priority: userEmail > clientIp > clientId
    let hasLiked = false;
    if (userEmail) {
      const existingLike = await prisma.like.findFirst({
        where: {
          postId: post.id,
          userEmail: userEmail,
        },
      });
      hasLiked = !!existingLike;
    } else if (clientIp !== "unknown") {
      const existingLike = await prisma.like.findFirst({
        where: {
          postId: post.id,
          userIp: clientIp,
        },
      });
      hasLiked = !!existingLike;
    } else if (clientId) {
      // Use clientId as fallback when IP is unknown
      const existingLike = await prisma.like.findFirst({
        where: {
          postId: post.id,
          userIp: clientId, // clientId is stored in userIp field as fallback
        },
      });
      hasLiked = !!existingLike;
    }

    return NextResponse.json({
      count: likesCount,
      hasLiked,
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch likes" },
      { status: 500 }
    );
  }
}

// POST toggle like (public access allowed)
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Decode the slug in case it's URL encoded
    const decodedSlug = decodeURIComponent(params.slug);
    
    const post = await prisma.post.findUnique({
      where: { slug: decodedSlug },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get request body for client ID
    let body: any = {};
    try {
      const contentType = request.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        body = await request.json();
      }
    } catch (error) {
      // Body parsing failed, use empty object
      console.warn("Failed to parse request body:", error);
    }
    const clientId = body?.clientId || null;

    // Check if clientId exists
    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Ensure Prisma client is connected
    if (!prisma || !prisma.like) {
      console.error("Prisma client or like model is not available");
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      );
    }

    // Check if like already exists with this clientId
    const existingLike = await prisma.like.findFirst({
      where: {
        postId: post.id,
        userIp: clientId,
      },
    });

    if (existingLike) {
      // Unlike - remove the like
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      
      const newCount = await prisma.like.count({
        where: { postId: post.id },
      });

      return NextResponse.json({
        liked: false,
        count: newCount,
      });
    } else {
      // Like - create new like
      await prisma.like.create({
        data: {
          postId: post.id,
          userIp: clientId,
          userEmail: null,
        },
      });

      const newCount = await prisma.like.count({
        where: { postId: post.id },
      });

      return NextResponse.json({
        liked: true,
        count: newCount,
      });
    }
  } catch (error: any) {
    console.error("Error toggling like:", error);
    console.error("Error stack:", error?.stack);
    console.error("Prisma available:", !!prisma);
    console.error("Prisma.like available:", !!(prisma && prisma.like));
    
    // Check if it's the specific "findFirst" error
    if (error?.message?.includes("findFirst") || error?.message?.includes("Cannot read properties")) {
      return NextResponse.json(
        { 
          error: "Database model not available. Please run: npx prisma generate",
          details: "Prisma client needs to be regenerated"
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to toggle like",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}



