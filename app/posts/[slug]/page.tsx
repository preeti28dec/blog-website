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

        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 md:p-8 lg:p-12">
          {post.category && (
            <Link
              href={`/?category=${post.category.slug}`}
              className="inline-block px-2.5 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs sm:text-sm rounded-full mb-3 sm:mb-4 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              {post.category.name}
            </Link>
          )}

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
            {post.title}
          </h1>

          <div className="mb-3 sm:mb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <span>By <span className="font-medium">{(post as any).creatorName || post.author?.name || post.author?.email || "Unknown author"}</span></span>
              <span className="hidden sm:inline">•</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <PostMetadata postSlug={slug} views={post.views || 0} />
          </div>

          {post.tags && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
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

          {post.imageUrl && (
            <div className="mb-6 sm:mb-8 relative w-full h-[250px] sm:h-[350px] md:h-[400px] lg:h-[500px] rounded-lg overflow-hidden shadow-md">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 800px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {post.excerpt && (
            <p className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 italic border-l-4 border-blue-500 pl-3 sm:pl-4">
              {post.excerpt}
            </p>
          )}

          {(() => {
            const hasHtmlTags = /<\/?[a-z][\s\S]*>/i.test(post.content);

            if (hasHtmlTags) {
              return (
                <div
                  className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none mb-6 sm:mb-8"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              );
            }

            return (
              <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none mb-6 sm:mb-8 whitespace-pre-line break-words">
                {post.content}
              </div>
            );
          })()}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
            <LikeButton postSlug={slug} />
            <SocialShare
              title={post.title}
              url={postUrl}
              description={post.excerpt || ""}
            />
          </div>
        </article>

        <CommentsSection postSlug={slug} postTitle={post.title} />
      </div>
    </div>
  );
}

