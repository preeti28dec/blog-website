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

// POST increment view count (only if first time viewing)
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

    // Get client IP
    const clientIp = getClientIp(request);
    
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

    // Check if user has already viewed this post
    // Priority: userEmail > clientIp > clientId
    let hasViewed = false;
    if (userEmail) {
      const existingView = await prisma.view.findFirst({
        where: {
          postId: post.id,
          userEmail: userEmail,
        },
      });
      hasViewed = !!existingView;
    } else if (clientIp !== "unknown") {
      const existingView = await prisma.view.findFirst({
        where: {
          postId: post.id,
          userIp: clientIp,
        },
      });
      hasViewed = !!existingView;
    } else if (clientId) {
      const existingView = await prisma.view.findFirst({
        where: {
          postId: post.id,
          clientId: clientId,
        },
      });
      hasViewed = !!existingView;
    }

    // If already viewed, return without incrementing
    if (hasViewed) {
      return NextResponse.json({
        viewed: false,
        message: "Already viewed",
        views: post.views,
      });
    }

    // Create view record
    await prisma.view.create({
      data: {
        postId: post.id,
        userIp: clientIp !== "unknown" ? clientIp : null,
        userEmail: userEmail,
        clientId: clientId || null,
      },
    });

    // Increment view count
    const updatedPost = await prisma.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({
      viewed: true,
      views: updatedPost.views,
    });
  } catch (error: any) {
    console.error("Error incrementing view:", error);
    return NextResponse.json(
      { 
        error: "Failed to increment view",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}



