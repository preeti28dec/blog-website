"use client";

import { useState, useEffect, useCallback } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";

interface PostMetadataProps {
  postSlug: string;
  views: number;
}

export default function PostMetadata({ postSlug, views }: PostMetadataProps) {
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Get or create a client identifier for tracking likes
      let clientId = null;
      if (typeof window !== "undefined") {
        clientId = localStorage.getItem("clientId");
        if (!clientId) {
          clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem("clientId", clientId);
        }
      }

      // Fetch likes
      const likesUrl = `/api/posts/${postSlug}/likes${clientId ? `?clientId=${encodeURIComponent(clientId)}` : ""}`;
      const likesResponse = await fetch(likesUrl);
      if (likesResponse.ok) {
        const likesData = await likesResponse.json();
        setLikesCount(likesData.count || 0);
        
        if (typeof window !== "undefined") {
          const likeKey = `like_${postSlug}`;
          const storedLike = localStorage.getItem(likeKey);
          setHasLiked(likesData.hasLiked || storedLike === "true");
        } else {
          setHasLiked(likesData.hasLiked || false);
        }
      }

      // Fetch comments count
      const commentsResponse = await fetch(`/api/posts/${postSlug}/comments`);
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        setCommentsCount(Array.isArray(commentsData) ? commentsData.length : 0);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
      // Fallback to localStorage for likes
      if (typeof window !== "undefined") {
        const likeKey = `like_${postSlug}`;
        const storedLike = localStorage.getItem(likeKey);
        setHasLiked(storedLike === "true");
      }
    } finally {
      setLoading(false);
    }
  }, [postSlug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (toggling || loading) return;

    setToggling(true);
    try {
      let clientId = null;
      if (typeof window !== "undefined") {
        clientId = localStorage.getItem("clientId");
        if (!clientId) {
          clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem("clientId", clientId);
        }
      }

      const response = await fetch(`/api/posts/${postSlug}/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikesCount(data.count || 0);
        setHasLiked(data.liked || false);
        
        if (typeof window !== "undefined") {
          const likeKey = `like_${postSlug}`;
          if (data.liked) {
            localStorage.setItem(likeKey, "true");
          } else {
            localStorage.removeItem(likeKey);
          }
        }
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setToggling(false);
    }
  };

  // Refresh comments count when a comment is added
  useEffect(() => {
    const handleCommentAdded = (event: CustomEvent) => {
      if (event.detail?.postSlug === postSlug) {
        fetch(`/api/posts/${postSlug}/comments`)
          .then((res) => res.json())
          .then((data) => {
            setCommentsCount(Array.isArray(data) ? data.length : 0);
          })
          .catch((err) => console.error("Error refreshing comments count:", err));
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("commentAdded", handleCommentAdded as EventListener);
      return () => {
        window.removeEventListener("commentAdded", handleCommentAdded as EventListener);
      };
    }
  }, [postSlug]);

  return (
    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
      <span className="flex items-center gap-1">
        <svg
          className="w-4 h-4 text-gray-600 dark:text-gray-400"
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
        {views || 0} views
      </span>
      
      <button
        type="button"
        onClick={handleToggleLike}
        disabled={toggling || loading}
        className={`flex items-center gap-1 transition-all ${
          hasLiked
            ? "text-red-600 dark:text-red-400"
            : "text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
        } ${toggling || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        aria-label={hasLiked ? "Unlike this post" : "Like this post"}
      >
        {loading ? (
          <FaRegHeart className="w-4 h-4 animate-pulse" />
        ) : hasLiked ? (
          <FaHeart className="w-4 h-4 fill-current" />
        ) : (
          <FaRegHeart className="w-4 h-4" />
        )}
        <span>{likesCount || 0}</span>
      </button>

      <span className="flex items-center gap-1">
        <svg
          className="w-4 h-4 text-gray-600 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {loading ? "..." : commentsCount} {commentsCount === 1 ? "comment" : "comments"}
      </span>
    </div>
  );
}

