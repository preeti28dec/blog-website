"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const commentSchema = z.object({
  authorName: z.string().min(1, "Name is required"),
  authorEmail: z.string().email("Invalid email address"),
  content: z.string().min(1, "Comment cannot be empty"),
});

interface CommentFormProps {
  postSlug: string;
  onCommentAdded: () => void;
}

export default function CommentForm({ postSlug, onCommentAdded }: CommentFormProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(commentSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/posts/${postSlug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setMessage("Comment submitted! It will be visible after approval.");
        reset();
        onCommentAdded();
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to submit comment");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-8">
      <h3 className="text-xl font-semibold mb-4">Leave a Comment</h3>
      
      {message && (
        <div
          className={`p-3 rounded ${
            message.includes("submitted")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input
            type="text"
            {...register("authorName")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.authorName && (
            <p className="text-red-500 text-sm mt-1">
              {errors.authorName.message as string}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            {...register("authorEmail")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.authorEmail && (
            <p className="text-red-500 text-sm mt-1">
              {errors.authorEmail.message as string}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Comment</label>
        <textarea
          {...register("content")}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.content && (
          <p className="text-red-500 text-sm mt-1">
            {errors.content.message as string}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Comment"}
      </button>
    </form>
  );
}

