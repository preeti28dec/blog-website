import { prisma } from "./prisma";
import { unstable_cache } from "next/cache";

// Cache posts for 60 seconds - separate cache keys for different categories
export async function getPosts(categorySlug?: string) {
  try {
    const cacheKey = categorySlug ? `posts-${categorySlug}` : "posts-all";
    
    const getCachedPosts = unstable_cache(
      async () => {
        const where: any = { published: true };
        if (categorySlug) {
          where.category = { slug: categorySlug };
        }

        return await prisma.post.findMany({
          where,
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
          orderBy: {
            createdAt: "desc",
          },
        });
      },
      [cacheKey],
      { revalidate: 60 }
    );

    return await getCachedPosts();
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

// Cache categories for 5 minutes
const getCachedCategories = unstable_cache(
  async () => {
    return await prisma.category.findMany({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  },
  ["categories"],
  { revalidate: 300 }
);

export async function getCategories() {
  try {
    return await getCachedCategories();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Cache individual posts for 60 seconds
export async function getPostBySlug(slug: string) {
  try {
    const getCachedPost = unstable_cache(
      async () => {
        return await prisma.post.findUnique({
          where: {
            slug,
          },
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
      },
      [`post-${slug}`],
      { revalidate: 60 }
    );

    return await getCachedPost();
  } catch (error) {
    console.error("Error fetching post:", error);
    return null;
  }
}


