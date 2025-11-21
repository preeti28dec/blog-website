"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import CategoryFilter from "@/components/CategoryFilter";

// Enable static generation with ISR (revalidate every 60 seconds)
// Note: This is now a client component, so ISR is handled differently

export default function Home() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || undefined;
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsRes = await fetch(category ? `/api/posts?category=${category}` : "/api/posts");
        const categoriesRes = await fetch("/api/categories");
        const postsData = await postsRes.json();
        const categoriesData = await categoriesRes.json();
        setPosts(postsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <CategoryFilter
          categories={categories}
          currentCategory={searchParams.category}
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">Loading...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                No posts found.
              </p>
            </div>
          ) : (
            posts.map((post: any) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug || post.id}`}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700 cursor-pointer hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden"
              >
                {post.imageUrl ? (
                  <div className="relative w-full h-48 md:h-56 overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <Image
                      src={post.imageUrl}
                      alt={post.title || "Article post image"}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-48 md:h-56 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <div className="text-center p-4">
                      <svg
                        className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        No image available
                      </p>
                    </div>
                  </div>
                )}
                <div className="px-6 pt-4 pb-2">
                  {/* First line: Author and Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>By</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {post.creatorName || post.author?.name || post.author?.email || "Unknown"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500"></span>
                    <span>
                      {new Date(post.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  
                  {/* Second line: Views, Likes, Comments */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9a3 3 0 100 6 3 3 0 000-6z"
                        />
                      </svg>
                      <span>
                        {post.views || 0} {(post.views || 0) === 1 ? "view" : "views"}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 ${(post._count?.likes || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      <svg
                        className="w-4 h-4"
                        fill={(post._count?.likes || 0) > 0 ? "currentColor" : "none"}
                        stroke={(post._count?.likes || 0) > 0 ? "none" : "currentColor"}
                        viewBox="0 0 24 24"
                      >
                        {(post._count?.likes || 0) > 0 ? (
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        )}
                      </svg>
                      <span>{post._count?.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      <span>
                        {post._count?.comments || 0} {(post._count?.comments || 0) === 1 ? "comment" : "comments"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {post.category && (
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full mb-3">
                      {post.category.name}
                    </span>
                  )}
                  <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  {post.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags
                        .split(",")
                        .slice(0, 3)
                        .map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                          >
                            #{tag.trim()}
                          </span>
                        ))}
                    </div>
                  )}
                  <div className="flex items-center justify-end">
                    <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      Read more
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
