import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  try {
    // Check Cloudinary configuration
    // Support both CLOUDINARY_URL and individual variables
    const hasCloudinaryUrl = !!process.env.CLOUDINARY_URL;
    const hasIndividualVars = !!process.env.CLOUDINARY_CLOUD_NAME && 
                              !!process.env.CLOUDINARY_API_KEY && 
                              !!process.env.CLOUDINARY_API_SECRET;
    
    const isCloudinaryConfigured = hasCloudinaryUrl || hasIndividualVars;

    // Authentication check removed - allowing public image uploads

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // More lenient validation - check both MIME type and file extension
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = file.type && (file.type.startsWith('image/') || validImageTypes.includes(file.type.toLowerCase()));

    // Allow if either MIME type or extension is valid, or if no type is set (let it through)
    if (!hasValidMimeType && !hasValidExtension && file.type) {
      // If we have a type but it's not an image, reject it
      return NextResponse.json(
        { error: 'File must be an image (PNG, JPG, GIF, WEBP, BMP, or SVG)' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB - increased limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Try to upload to Cloudinary if configured, otherwise use base64 fallback
    if (isCloudinaryConfigured) {
      try {
        // Upload to Cloudinary
        const result = await uploadImage(buffer, 'blog-images');
        return NextResponse.json({
          url: result.secure_url,
          publicId: result.public_id,
        });
      } catch (cloudinaryError: any) {
        console.warn('Cloudinary upload failed, falling back to base64:', cloudinaryError.message);
        // Fall through to base64 fallback
      }
    }

    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      publicId: null, // No public ID for base64 images
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



