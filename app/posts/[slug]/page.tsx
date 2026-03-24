"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SocialShare from "@/components/SocialShare";
import CommentsSection from "@/components/CommentsSection";
import LikeButton from "@/components/LikeButton";
import PostMetadata from "@/components/PostMetadata";

// Note: This is now a client component, so ISR is handled differently

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data);
          
          // Track view count - only increment on first visit
          if (typeof window !== "undefined") {
            const viewKey = `view_${slug}`;
            const hasViewed = localStorage.getItem(viewKey);
            
            if (!hasViewed) {
              // Get or create a client identifier for tracking views
              let clientId = localStorage.getItem("clientId");
              if (!clientId) {
                clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                localStorage.setItem("clientId", clientId);
              }
              
              // Mark as viewed in localStorage first to prevent duplicate calls
              localStorage.setItem(viewKey, "true");
              
              // Call the view increment endpoint
              try {
                await fetch(`/api/posts/${slug}/views`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ clientId }),
                });
                
                // Update the view count in the post data
                setPost((prevPost: any) => ({
                  ...prevPost,
                  views: (prevPost?.views || 0) + 1,
                }));
              } catch (error) {
                console.error("Error incrementing view:", error);
                // If the API call fails, remove the localStorage flag so it can retry
                localStorage.removeItem(viewKey);
              }
            }
          }
        } else if (response.status === 404) {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm sm:text-base">Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Post not found</h1>
          <Link href="/" className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline">
            Back to posts
          </Link>
        </div>
      </div>
    );
  }

  const postUrl = typeof window !== "undefined" ? `${window.location.origin}/posts/${slug}` : `/posts/${slug}`;

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:underline mb-4 sm:mb-6 inline-block"
        >
          ← Back to posts
        </Link>

        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {(() => {
            // Get hero image (featured image or first image)
            const postImages = (post as any).images || [];
            let heroImage: string | null = null;
            
            if (postImages.length > 0 && Array.isArray(postImages)) {
              // Find featured image or use first image
              const featured = postImages.find((img: any) => img.isFeatured);
              heroImage = featured ? featured.url : (postImages[0]?.url || null);
            } else {
              // Fallback to imageUrls or imageUrl
              const imageUrls = (post.imageUrls && Array.isArray(post.imageUrls) && post.imageUrls.length > 0) 
                ? post.imageUrls 
                : [];
              heroImage = imageUrls.length > 0 ? imageUrls[0] : (post.imageUrl || null);
            }

            // Show hero image at the top (full width, no padding)
            if (heroImage) {
              return (
                <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
                  <Image
                    src={heroImage}
                    alt={post.title}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                  />
                </div>
              );
            }
            return null;
          })()}

          <div className="p-4 sm:p-6 md:p-8 lg:p-12">
            {post.category && (
              <Link
                href={`/?category=${post.category.slug}`}
                className="inline-block px-2.5 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs sm:text-sm rounded-full mb-4 sm:mb-6 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                {post.category.name}
              </Link>
            )}

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white leading-tight">
              {post.title}
            </h1>

            <div className="mb-4 sm:mb-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                <span>By <span className="font-semibold text-gray-900 dark:text-white">{(post as any).creatorName || post.author?.name || post.author?.email || "Unknown author"}</span></span>
                <span className="hidden sm:inline">•</span>
                <span>{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <PostMetadata postSlug={slug} views={post.views || 0} />
            </div>

            {post.tags && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8">
                {post.tags.split(",").map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs sm:text-sm rounded"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}

            {post.excerpt && (
              <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 sm:mb-10 leading-relaxed">
                {post.excerpt}
              </p>
            )}

          {(() => {
            const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(post.content);

            if (hasHtmlTags) {
              return (
                <>
                  <style jsx>{`
                    .prose {
                      font-size: 1.125rem;
                      line-height: 1.75;
                      color: #374151;
                    }
                    .dark .prose {
                      color: #d1d5db;
                    }
                    .prose p {
                      margin-top: 1.25em;
                      margin-bottom: 1.25em;
                    }
                    .prose h2 {
                      font-size: 1.875rem;
                      font-weight: 700;
                      margin-top: 2em;
                      margin-bottom: 1em;
                    }
                    .prose h3 {
                      font-size: 1.5rem;
                      font-weight: 600;
                      margin-top: 1.5em;
                      margin-bottom: 0.75em;
                    }
                    .prose .image-full {
                      width: 100%;
                      margin: 2rem 0;
                      clear: both;
                    }
                    .prose .image-full img {
                      width: 100%;
                      height: auto;
                      border-radius: 0.5rem;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    }
                    .prose .image-center {
                      text-align: center;
                      margin: 2rem 0;
                      clear: both;
                    }
                    .prose .image-center img {
                      max-width: 100%;
                      height: auto;
                      border-radius: 0.5rem;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    }
                    .prose .image-inline {
                      margin: 1.5rem 0;
                      clear: both;
                    }
                    .prose .image-inline.float-left {
                      float: left;
                      margin-right: 2rem;
                      margin-left: 0;
                      margin-top: 0.5rem;
                      margin-bottom: 1rem;
                      max-width: 350px;
                    }
                    .prose .image-inline.float-right {
                      float: right;
                      margin-left: 2rem;
                      margin-right: 0;
                      margin-top: 0.5rem;
                      margin-bottom: 1rem;
                      max-width: 350px;
                    }
                    .prose .image-inline img {
                      width: 100%;
                      height: auto;
                      border-radius: 0.5rem;
                      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    }
                    .prose figure {
                      margin: 1.5rem 0;
                    }
                    .prose figcaption {
                      font-size: 0.875rem;
                      color: #6b7280;
                      margin-top: 0.75rem;
                      font-style: italic;
                      text-align: center;
                      line-height: 1.5;
                    }
                    .dark .prose figcaption {
                      color: #9ca3af;
                    }
                    .prose .image-inline.float-left figcaption,
                    .prose .image-inline.float-right figcaption {
                      text-align: left;
                    }
                    @media (max-width: 768px) {
                      .prose {
                        font-size: 1rem;
                      }
                      .prose .image-inline {
                        float: none !important;
                        margin: 1.5rem auto !important;
                        display: block;
                        max-width: 100% !important;
                      }
                      .prose .image-inline img {
                        max-width: 100%;
                      }
                      .prose .image-inline.float-left figcaption,
                      .prose .image-inline.float-right figcaption {
                        text-align: center;
                      }
                    }
                    @media (min-width: 769px) {
                      .prose {
                        font-size: 1.125rem;
                      }
                    }
                  `}</style>
                  <div
                    className="prose prose-lg dark:prose-invert max-w-none mb-8 sm:mb-10"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </>
              );
            }

            return (
              <div className="prose prose-lg dark:prose-invert max-w-none mb-8 sm:mb-10 whitespace-pre-line break-words text-gray-700 dark:text-gray-300 leading-relaxed">
                {post.content}
              </div>
            );
          })()}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
              <LikeButton postSlug={slug} />
              <SocialShare
                title={post.title}
                url={postUrl}
                description={post.excerpt || ""}
              />
            </div>
          </div>
        </article>

        <CommentsSection postSlug={slug} postTitle={post.title} />
      </div>
    </div>
  );
}

