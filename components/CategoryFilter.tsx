"use client";

import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

interface CategoryFilterProps {
  categories: Category[];
  currentCategory?: string;
}

export default function CategoryFilter({
  categories,
  currentCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center mb-8">
      <Link
        href="/"
        className={`px-4 py-2 rounded-lg transition-colors ${
          !currentCategory
            ? "bg-blue-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        All posts
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/?category=${category.slug}`}
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentCategory === category.slug
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {category.name} ({category._count.posts})
        </Link>
      ))}
    </div>
  );
}

