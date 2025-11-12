import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || "your-secret-key";

// Helper function to get user from either NextAuth session or JWT token
async function getAuthenticatedUser(request: NextRequest) {
  let userId: string | null = null;

  // Try NextAuth session first
  const session = await getServerSession(authOptions);
  if (session && (session.user as any)?.id) {
    userId = (session.user as any).id;
  }

  // If no session, try JWT token from Authorization header
  if (!userId) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.id) {
          userId = decoded.id;
        }
      } catch (error) {
        console.error('JWT verification error:', error);
        return null;
      }
    }
  }

  // Always fetch user from database to ensure we have the latest role
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (user) {
      return {
        id: user.id,
        role: user.role,
      };
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Check Cloudinary configuration
    // Support both CLOUDINARY_URL and individual variables
    const hasCloudinaryUrl = !!process.env.CLOUDINARY_URL;
    const hasIndividualVars = !!process.env.CLOUDINARY_CLOUD_NAME && 
                              !!process.env.CLOUDINARY_API_KEY && 
                              !!process.env.CLOUDINARY_API_SECRET;
    
    if (!hasCloudinaryUrl && !hasIndividualVars) {
      console.error('Cloudinary configuration missing:', {
        cloudinary_url: hasCloudinaryUrl,
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET,
      });
      return NextResponse.json(
        { error: 'Image upload service is not configured. Please contact the administrator.' },
        { status: 500 }
      );
    }

    // Check authentication - any authenticated user can upload images for their posts
    const user = await getAuthenticatedUser(request);
    console.log('Upload auth check - user:', user); // Debug log
    
    if (!user || !user.id) {
      console.log('Upload failed: No user found');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to upload images' },
        { status: 401 }
      );
    }
    
    // Allow any authenticated user to upload images (they can create posts, so they should be able to upload images)
    // If you want to restrict to admins only, uncomment the following:
    /*
    const userRole = user.role?.toUpperCase() || '';
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    */

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    console.log('Attempting to upload image to Cloudinary...');
    const result = await uploadImage(buffer, 'blog-images');
    console.log('Image uploaded successfully:', result.secure_url);

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Provide more specific error messages
    let errorMessage = 'Failed to upload image';
    if (error?.message) {
      if (error.message.includes('Invalid API Key') || error.message.includes('401')) {
        errorMessage = 'Invalid Cloudinary API credentials. Please check your configuration.';
      } else if (error.message.includes('cloud_name')) {
        errorMessage = 'Cloudinary cloud name is missing or invalid.';
      } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}



