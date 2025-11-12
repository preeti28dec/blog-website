"use client";

import { useState } from "react";
import CommentsList from "@/components/CommentsList";
import CommentForm from "@/components/CommentForm";

interface CommentsSectionProps {
  postSlug: string;
  postTitle?: string;
}

export default function CommentsSection({ postSlug, postTitle }: CommentsSectionProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCommentAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 md:p-12">
      <CommentsList postSlug={postSlug} postTitle={postTitle} refreshTrigger={refreshTrigger} />
      <CommentForm postSlug={postSlug} onCommentAdded={handleCommentAdded} />
    </div>
  );
}

