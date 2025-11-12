import Link from "next/link";
import Image from "next/image";
import { getPosts, getCategories } from "@/lib/posts";
import CategoryFilter from "@/components/CategoryFilter";

// Enable static generation with ISR (revalidate every 60 seconds)
export const revalidate = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const posts = await getPosts(searchParams.category);
  const categories = await getCategories();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Welcome to Our Blog
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 text-center">
          Discover amazing articles and stories
        </p>

        <CategoryFilter categories={categories} currentCategory={searchParams.category} />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {posts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                No posts yet. Check back soon!
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
                      alt={post.title || "Blog post image"}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-48 md:h-56 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <div className="text-center p-4">
                      <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No image</p>
                    </div>
                  </div>
                )}
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
                      {post.tags.split(",").slice(0, 3).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    <span className="text-blue-600 dark:text-blue-400 hover:underline">
                      Read more →
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

