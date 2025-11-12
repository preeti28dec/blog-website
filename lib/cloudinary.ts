import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
// Cloudinary SDK automatically reads CLOUDINARY_URL if set
// Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
const cloudinaryUrl = process.env.CLOUDINARY_URL;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudinaryUrl) {
  // CLOUDINARY_URL is set - SDK automatically reads it from process.env
  // No need to call config() - SDK handles it automatically
  // But we can verify it's set by checking the config
  console.log('Cloudinary configured from CLOUDINARY_URL');
} else if (cloudName && apiKey && apiSecret) {
  // Individual variables are set
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log('Cloudinary configured from individual variables');
} else {
  console.warn('Cloudinary configuration is incomplete. Image uploads will fail.');
  console.warn('Required: Either CLOUDINARY_URL or (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
}

export { cloudinary };

/**
 * Upload an image to Cloudinary
 * @param file - File buffer or base64 string
 * @param folder - Optional folder path in Cloudinary
 * @returns Promise with upload result containing secure_url
 */
export async function uploadImage(
  file: Buffer | string,
  folder: string = 'blog-images'
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder,
      resource_type: 'image' as const,
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
    };

    if (Buffer.isBuffer(file)) {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          } else {
            reject(new Error('Upload failed: No result returned'));
          }
        }
      );
      uploadStream.end(file);
    } else {
      cloudinary.uploader.upload(file, uploadOptions, (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      });
    }
  });
}

/**
 * Delete an image from Cloudinary
 * @param publicId - Public ID of the image to delete
 * @returns Promise with deletion result
 */
export async function deleteImage(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get optimized image URL from Cloudinary
 * @param imageUrl - Full Cloudinary URL or public ID
 * @param width - Optional width for transformation
 * @param height - Optional height for transformation
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  width?: number,
  height?: number
): string {
  if (!imageUrl) return '';
  
  // If it's already a Cloudinary URL, extract public ID or return as is
  if (imageUrl.includes('cloudinary.com')) {
    const transformations: string[] = [];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (transformations.length > 0) {
      const transformString = transformations.join(',');
      return imageUrl.replace('/upload/', `/upload/${transformString}/`);
    }
    return imageUrl;
  }
  
  // If it's a public ID, construct the URL
  // Try to get cloud name from CLOUDINARY_URL or individual variable
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName && process.env.CLOUDINARY_URL) {
    // Extract cloud name from CLOUDINARY_URL format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    const match = process.env.CLOUDINARY_URL.match(/@([^:]+)$/);
    if (match) {
      cloudName = match[1];
    }
  }
  
  if (!cloudName) {
    return imageUrl; // Fallback to original URL if we can't determine cloud name
  }
  
  const transformations: string[] = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  const transformString = transformations.length > 0 ? `${transformations.join(',')}/` : '';
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${imageUrl}`;
}



