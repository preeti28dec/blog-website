"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  published: z.boolean().default(false),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  creatorName: z.string().optional(),
});

interface Post {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt: string | null;
  published: boolean;
  tags: string;
  imageUrl: string | null;
  category: { id: string; name: string; slug: string } | null;
  createdAt: string;
  editToken?: string;
  creatorName?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Helper functions to manage edit tokens in localStorage
const getEditToken = (slug: string): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`editToken_${slug}`);
};

const saveEditToken = (slug: string, token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(`editToken_${slug}`, token);
};

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [createdEditToken, setCreatedEditToken] = useState<string | null>(null);
  const [createdPostSlug, setCreatedPostSlug] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(postSchema),
  });

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Load posts and categories on mount
  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Set uploading state immediately for visual feedback
    setUploadingFileName(file.name);
    setUploadingImage(true);
    console.log('Starting image upload...', file.name);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Image uploaded successfully:', data.url);
        setImageUrl(data.url);
        setValue('imageUrl', data.url, { shouldValidate: true });
        // Clear file input so user can upload a different image
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        console.error('Upload failed:', errorData);
        const errorMessage = errorData.error || `Server error (${response.status})`;
        alert(`Upload failed: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error?.message || 'Network error. Please check your connection and try again.';
      alert(`Failed to upload image: ${errorMessage}`);
    } finally {
      setUploadingImage(false);
      setUploadingFileName("");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const url = editingPost
        ? `/api/posts/${editingPost.slug}`
        : "/api/posts";
      const method = editingPost ? "PUT" : "POST";

      // Include imageUrl in the data - prioritize state over form data
      const postData: any = {
        ...data,
      };
      
      // Handle imageUrl - use state value if available, otherwise form data, or null
      if (imageUrl && imageUrl.trim() !== "") {
        postData.imageUrl = imageUrl.trim();
      } else if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim() !== "") {
        postData.imageUrl = data.imageUrl.trim();
      } else {
        // Explicitly set to null if no image
        postData.imageUrl = null;
      }

      console.log('Submitting post with data:', postData); // Debug log
      console.log('ImageUrl state:', imageUrl); // Debug log

      // If editing, add edit token from localStorage
      if (editingPost) {
        const editToken = getEditToken(editingPost.slug);
        if (editToken) {
          postData.editToken = editToken;
        } else {
          alert("Edit token not found. You can only edit posts you created.");
          return;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // If creating a new post, save the edit token
        if (!editingPost && result.editToken) {
          saveEditToken(result.slug, result.editToken);
          setCreatedEditToken(result.editToken);
          setCreatedPostSlug(result.slug);
        }
        
        reset();
        setImageUrl("");
        setValue("imageUrl", "");
        setDragActive(false);
        setShowForm(false);
        setEditingPost(null);
        fetchPosts();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || "Failed to save post"}`);
      }
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Failed to save post");
    }
  };

  const handleEdit = (post: Post) => {
    // Check if user has edit token for this post
    const editToken = getEditToken(post.slug);
    if (!editToken) {
      alert("You can only edit posts you created. The edit token is not available for this post.");
      return;
    }
    
    setEditingPost(post);
    setValue("title", post.title);
    setValue("content", post.content || "");
    setValue("excerpt", post.excerpt || "");
    setValue("published", post.published);
    setValue("categoryId", post.category?.id || "");
    setValue("tags", post.tags || "");
    setValue("imageUrl", post.imageUrl || "");
    setValue("creatorName", post.creatorName || "");
    setImageUrl(post.imageUrl || "");
    setShowForm(true);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    // Check if user has edit token for this post
    const editToken = getEditToken(slug);
    if (!editToken) {
      alert("You can only delete posts you created. The edit token is not available for this post.");
      return;
    }

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ editToken }),
      });

      if (response.ok) {
        // Remove edit token from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem(`editToken_${slug}`);
        }
        fetchPosts();
      } else {
        const error = await response.json();
        alert(`Failed to delete post: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategory }),
      });

      if (response.ok) {
        setNewCategory("");
        setShowCategoryForm(false);
        fetchCategories();
      } else {
        alert("Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Show edit token after creating a post */}
        {createdEditToken && createdPostSlug && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              Post created successfully!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
              Save this edit token to edit or delete your post later:
            </p>
            <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-200 dark:border-green-700 mb-2">
              <code className="text-xs break-all text-gray-800 dark:text-gray-200">
                {createdEditToken}
              </code>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              This token has been saved to your browser's local storage. You can only edit posts you created.
            </p>
            <button
              onClick={() => {
                setCreatedEditToken(null);
                setCreatedPostSlug(null);
              }}
              className="mt-2 text-sm text-green-700 dark:text-green-300 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Create & Manage Articles</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCategoryForm(!showCategoryForm);
                setShowForm(false);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {showCategoryForm ? "Cancel" : "New Category"}
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingPost(null);
                reset();
                setImageUrl("");
                setDragActive(false);
                setShowCategoryForm(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? "Cancel" : "New Post"}
            </button>
          </div>
        </div>

        {showCategoryForm && (
          <form
            onSubmit={handleCreateCategory}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">Create Category</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8"
          >
            <h2 className="text-xl font-semibold mb-4">
              {editingPost ? "Edit Post" : "Create New Post"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  {...register("title")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.title.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Content
                </label>
                <textarea
                  {...register("content")}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.content && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.content.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Excerpt (optional)
                </label>
                <input
                  type="text"
                  {...register("excerpt")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  {...register("creatorName")}
                  placeholder="Enter your name to be displayed as the author"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will be shown as the author of the article
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  {...register("categoryId")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  {...register("tags")}
                  placeholder="react, nextjs, tutorial"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Featured Image
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (!imageUrl && !uploadingImage && fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                    uploadingImage
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : dragActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600"
                  } ${uploadingImage ? "pointer-events-none" : imageUrl ? "" : "cursor-pointer hover:border-blue-400"}`}
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="relative mb-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800"></div>
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-600 border-r-blue-600 absolute top-0 left-0"></div>
                      </div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Uploading image...</p>
                      {uploadingFileName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                          {uploadingFileName}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Please wait</p>
                    </div>
                  ) : imageUrl ? (
                    <div className="space-y-4">
                      <div className="relative inline-block mx-auto">
                        <img
                          src={imageUrl}
                          alt="Featured image preview"
                          className="max-w-full h-auto max-h-80 mx-auto rounded-lg border border-gray-300 dark:border-gray-600 shadow-md object-contain"
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (fileInputRef.current) {
                              fileInputRef.current.click();
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Change Image
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageUrl("");
                            setValue("imageUrl", "");
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Click &quot;Change Image&quot; to replace or drag and drop a new image
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-center">
                        <svg
                          className="h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                          Click to upload
                        </span>{" "}
                        <span className="text-gray-600 dark:text-gray-400">or drag and drop</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <input
                  type="hidden"
                  {...register("imageUrl")}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="published"
                  {...register("published")}
                  className="mr-2"
                />
                <label htmlFor="published">Published</label>
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingPost ? "Update Post" : "Create Post"}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No posts yet
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-6 py-4">
                      <Link
                        href={`/posts/${post.slug || post.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {post.category ? (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          post.published
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(post.slug)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
