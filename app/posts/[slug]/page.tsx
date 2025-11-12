import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/posts";
import Link from "next/link";
import { Metadata } from "next";
import Image from "next/image";
import SocialShare from "@/components/SocialShare";
import CommentsSection from "@/components/CommentsSection";

// Enable static generation with ISR (revalidate every 60 seconds)
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // Try to get post by slug first
  let post = await getPostBySlug(params.slug);

  // If not found by slug, try by ID (fallback)
  if (!post && params.slug) {
    try {
      const { prisma } = await import("@/lib/prisma");
      post = await prisma.post.findUnique({
        where: { id: params.slug },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      // Ignore error, will return not found metadata
    }
  }

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    keywords: post.tags ? post.tags.split(",").map((t) => t.trim()) : [],
    openGraph: {
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160),
      type: "article",
      publishedTime: new Date(post.createdAt).toISOString(),
      authors: [post.author.name || post.author.email],
      images: post.imageUrl ? [
        {
          url: post.imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.content.substring(0, 160),
      images: post.imageUrl ? [post.imageUrl] : [],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: { slug: string };
}) {
  // Try to get post by slug first
  let post = await getPostBySlug(params.slug);

  // If not found by slug, try by ID (fallback for old posts)
  if (!post && params.slug) {
    try {
      const { prisma } = await import("@/lib/prisma");
      post = await prisma.post.findUnique({
        where: { id: params.slug },
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
    } catch (error) {
      console.error("Error fetching post by ID:", error);
    }
  }

  if (!post) {
    notFound();
  }

  const postUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/posts/${params.slug}`;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-6 inline-block"
        >
          ← Back to posts
        </Link>

        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12">
          {post.category && (
            <Link
              href={`/?category=${post.category.slug}`}
              className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full mb-4 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              {post.category.name}
            </Link>
          )}

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <span>By {post.author.name || post.author.email}</span>
            <span>•</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span>{post.views || 0} views</span>
          </div>

          {post.tags && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.split(",").map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          {post.imageUrl && (
            <div className="mb-8 relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-md">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {post.excerpt && (
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 italic border-l-4 border-blue-500 pl-4">
              {post.excerpt}
            </p>
          )}

          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <SocialShare
            title={post.title}
            url={postUrl}
            description={post.excerpt || ""}
          />
        </article>

        <CommentsSection postSlug={params.slug} postTitle={post.title} />
      </div>
    </div>
  );
}

