"use client";

import { useEffect, useState } from "react";

interface Comment {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface CommentsListProps {
  postSlug: string;
  postTitle?: string;
  refreshTrigger?: number;
}

export default function CommentsList({ postSlug, postTitle, refreshTrigger }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postSlug}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postSlug, refreshTrigger]);

  if (loading) {
    return <div className="mt-8">Loading comments...</div>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold mb-6">
        Comments ({comments.length})
      </h3>
      {postTitle && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Comments on: <span className="font-semibold text-gray-900 dark:text-white">{postTitle}</span>
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-gray-500">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {comment.authorName}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

