"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const ADMIN_TEXT = {
  titleRequired: "Title is required.",
  contentRequired: "Content is required.",
  accessDenied: "You do not have permission to view this page.",
  imageTypeError: "Please upload a valid image file.",
  imageSizeError: "Image must be 5MB or smaller.",
  uploadFailed: "Upload failed",
  networkError: "Network error",
  postUpdated: "Post updated successfully!",
  postCreated: "Post created successfully!",
  failedToSave: "Failed to save post.",
  failedToLoadPosts: "Failed to load posts.",
  deleteConfirm: "Are you sure you want to delete this post?",
  postDeleted: "Post deleted.",
  failedToDelete: "Failed to delete post.",
  failedToCreateCategory: "Failed to create category.",
  loading: "Loading...",
  saveEditToken: "Save this edit token so you can edit the post later.",
  editTokenSaved: "The token was also stored locally for convenience.",
  dismiss: "Dismiss",
  title: "Manage Posts",
  cancel: "Cancel",
  newCategory: "New Category",
  newPost: "New Post",
  createCategory: "Create Category",
  categoryName: "Category name",
  create: "Create",
  editPost: "Edit Post",
  createNewPost: "Create New Post",
  postTitle: "Post title",
  content: "Content",
  excerptOptional: "Excerpt (optional)",
  yourName: "Your name",
  yourNamePlaceholder: "John Doe",
  yourNameHint: "Displayed as the author for this post.",
  category: "Category",
  noCategory: "No category",
  tags: "Tags",
  tagsPlaceholder: "Comma separated e.g. sports,football",
  featuredImage: "Featured image",
  uploading: "Uploading...",
  pleaseWait: "This may take a few seconds.",
  changeImage: "Change image",
  remove: "Remove",
  changeImageHint: "Replace or remove the current image above.",
  clickToUpload: "Click to upload",
  dragAndDrop: "or drag and drop",
  imageFormat: "PNG, JPG, GIF up to 5MB.",
  published: "Published",
  updating: "Updating...",
  creating: "Creating...",
  updatePost: "Update Post",
  tableTitle: "Title",
  tableCategory: "Category",
  tableStatus: "Status",
  tableDate: "Created",
  tableActions: "Actions",
  noPostsYet: "No posts yet.",
  statusPublished: "Published",
  statusDraft: "Draft",
  edit: "Edit",
  delete: "Delete",
};

type AdminTextKey = keyof typeof ADMIN_TEXT;

const translateAdminText = (key: string): string => {
  const normalizedKey = key.replace(/^admin\./, "") as AdminTextKey;
  return ADMIN_TEXT[normalizedKey] ?? key;
};

const normalizeToArray = <T,>(data: any): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.posts)) return data.posts;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const fetchJsonOrThrow = async (response: Response) => {
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    // Ignore parse errors; let status handling show useful info.
  }

  if (!response.ok) {
    const message =
      (payload && (payload.error || payload.message)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload ?? {};
};

export default function AdminPage() {
  const t = translateAdminText;
  
  const postSchema = z.object({
    title: z.string().min(1, t("admin.titleRequired")),
    content: z.string().min(1, t("admin.contentRequired")),
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

  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check authentication and role
  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session || !session.user) {
      router.push("/login");
      return;
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
      toast.error(t("admin.accessDenied"));
      router.push("/");
      return;
    }
  }, [session, status, router, t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(postSchema),
  });

  const fetchPosts = useCallback(async () => {
    try {
      setPostsError(null);
      const response = await fetch("/api/posts");
      const data = await fetchJsonOrThrow(response);
      setPosts(normalizeToArray<Post>(data));
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
      setPostsError(
        error instanceof Error ? error.message : t("admin.failedToSave")
      );
    }
  }, [t]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await fetchJsonOrThrow(response);
      setCategories(normalizeToArray<Category>(data));
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  }, []);

  // Load posts and categories on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchPosts(), fetchCategories()]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchPosts, fetchCategories]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t("admin.imageTypeError"));
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(t("admin.imageSizeError"));
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
        alert(`${t("admin.uploadFailed")}: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error?.message || t("admin.networkError");
      alert(`${t("admin.uploadFailed")}: ${errorMessage}`);
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
    setIsSubmitting(true);
    try {
      const url = editingPost
        ? `/api/posts/${editingPost.slug}`
        : "/api/posts";
      const method = editingPost ? "PUT" : "POST";

      // Convert tags array to comma-separated string
      const tagsString = tags.join(",");

      // Include imageUrl in the data - prioritize state over form data
      const postData: any = {
        ...data,
        tags: tagsString,
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

      // Edit token no longer required - anyone can edit any post

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
        setTags([]);
        setTagInput("");
        fetchPosts();
        
        // Show success toast
        if (editingPost) {
          toast.success(t("admin.postUpdated"));
        } else {
          toast.success(t("admin.postCreated"));
        }
      } else {
        const error = await response.json();
        toast.error(error.error || t("admin.failedToSave"));
      }
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error(t("admin.failedToSave"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (post: Post) => {
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
    // Parse tags from comma-separated string to array
    if (post.tags) {
      const parsedTags = post.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      setTags(parsedTags);
    } else {
      setTags([]);
    }
    setTagInput("");
    setShowForm(true);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(t("admin.deleteConfirm"))) return;

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        fetchPosts();
        toast.success(t("admin.postDeleted"));
      } else {
        const error = await response.json();
        alert(`${t("admin.failedToDelete")}: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(t("admin.failedToDelete"));
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
        alert(t("admin.failedToCreateCategory"));
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert(t("admin.failedToCreateCategory"));
    }
  };

  // Show loading while checking auth
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        <div className="text-center text-sm sm:text-base">{t("admin.loading")}</div>
      </div>
    );
  }

  // Show unauthorized if not logged in or wrong role
  if (!session || !session.user) {
    return null; // Will redirect
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Show edit token after creating a post */}
        {createdEditToken && createdPostSlug && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2 text-sm sm:text-base">
              {t("admin.postCreated")}
            </h3>
            <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 mb-2">
              {t("admin.saveEditToken")}
            </p>
            <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded border border-green-200 dark:border-green-700 mb-2">
              <code className="text-xs break-all text-gray-800 dark:text-gray-200">
                {createdEditToken}
              </code>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              {t("admin.editTokenSaved")}
            </p>
            <button
              onClick={() => {
                setCreatedEditToken(null);
                setCreatedPostSlug(null);
              }}
              className="mt-2 text-xs sm:text-sm text-green-700 dark:text-green-300 hover:underline"
            >
              {t("admin.dismiss")}
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">{t("admin.title")}</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setShowCategoryForm(!showCategoryForm);
                setShowForm(false);
              }}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              {showCategoryForm ? t("admin.cancel") : t("admin.newCategory")}
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingPost(null);
                reset();
                setImageUrl("");
                setDragActive(false);
                setShowCategoryForm(false);
                setTags([]);
                setTagInput("");
              }}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              {showForm ? t("admin.cancel") : t("admin.newPost")}
            </button>
          </div>
        </div>

        
        {showCategoryForm && (
          <form
            onSubmit={handleCreateCategory}
            className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t("admin.createCategory")}</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder={t("admin.categoryName")}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              />
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                {t("admin.create")}
              </button>
            </div>
          </form>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              {editingPost ? t("admin.editPost") : t("admin.createNewPost")}
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">{t("admin.postTitle")}</label>
                <input
                  type="text"
                  {...register("title")}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.title.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  {t("admin.content")}
                </label>
                <textarea
                  {...register("content")}
                  rows={8}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
                {errors.content && (
                  <p className="text-red-500 text-xs sm:text-sm mt-1">
                    {errors.content.message as string}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  {t("admin.excerptOptional")}
                </label>
                <input
                  type="text"
                  {...register("excerpt")}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  {t("admin.yourName")}
                </label>
                <input
                  type="text"
                  {...register("creatorName")}
                  placeholder={t("admin.yourNamePlaceholder")}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("admin.yourNameHint")}
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  {t("admin.category")}
                </label>
                <select
                  {...register("categoryId")}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="">{t("admin.noCategory")}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  {t("admin.tags")}
                </label>
                <div className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent min-h-[42px] flex flex-wrap gap-2 items-center">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          const newTags = tags.filter((_, i) => i !== index);
                          setTags(newTags);
                        }}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                        aria-label={`Remove ${tag} tag`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const trimmedInput = tagInput.trim();
                        if (trimmedInput && !tags.includes(trimmedInput)) {
                          setTags([...tags, trimmedInput]);
                          setTagInput("");
                        } else if (trimmedInput && tags.includes(trimmedInput)) {
                          setTagInput("");
                        }
                      } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
                        setTags(tags.slice(0, -1));
                      }
                    }}
                    placeholder={tags.length === 0 ? t("admin.tagsPlaceholder") : ""}
                    className="flex-1 min-w-[120px] border-0 outline-none bg-transparent text-sm sm:text-base"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Press Enter or comma to add a tag
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  {t("admin.featuredImage")}
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
                  className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-all duration-200 ${
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
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t("admin.uploading")}</p>
                      {uploadingFileName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xs">
                          {uploadingFileName}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t("admin.pleaseWait")}</p>
                    </div>
                  ) : imageUrl ? (
                    <div className="space-y-4">
                      <div className="relative inline-block mx-auto">
                        <Image
                          src={imageUrl}
                          alt="Featured image preview"
                          width={800}
                          height={600}
                          unoptimized
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
                          {t("admin.changeImage")}
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
                          {t("admin.remove")}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("admin.changeImageHint")}
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
                          {t("admin.clickToUpload")}
                        </span>{" "}
                        <span className="text-gray-600 dark:text-gray-400">{t("admin.dragAndDrop")}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("admin.imageFormat")}
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
                <label htmlFor="published">{t("admin.published")}</label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isSubmitting && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isSubmitting
                  ? editingPost
                    ? t("admin.updating")
                    : t("admin.creating")
                  : editingPost
                  ? t("admin.updatePost")
                  : t("admin.newPost")}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.tableTitle")}
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.tableCategory")}
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.tableStatus")}
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.tableDate")}
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.tableActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {postsError ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                    <p className="text-red-500 text-sm sm:text-base">{t("admin.failedToLoadPosts")}</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {postsError}
                    </p>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-gray-500 text-sm sm:text-base">
                    {t("admin.noPostsYet")}
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                      <Link
                        href={`/posts/${post.slug || post.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer text-xs sm:text-sm break-words"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                      {post.category ? (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                          {post.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          post.published
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {post.published ? t("admin.statusPublished") : t("admin.statusDraft")}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm text-left sm:text-center"
                        >
                          {t("admin.edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(post.slug)}
                          className="text-red-600 hover:text-red-800 text-xs sm:text-sm text-left sm:text-center"
                        >
                          {t("admin.delete")}
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
    </div>
  );
}
