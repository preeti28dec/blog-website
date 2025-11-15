"use client";

import { useState, useEffect, useCallback } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";

interface LikeButtonProps {
  postSlug: string;
}

export default function LikeButton({ postSlug }: LikeButtonProps) {
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchLikes = useCallback(async () => {
    try {
      // Get or create a client identifier for tracking likes
      let clientId = null;
      if (typeof window !== "undefined") {
        clientId = localStorage.getItem("clientId");
        if (!clientId) {
          // Generate a unique client ID
          clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem("clientId", clientId);
        }
      }

      // Include clientId as query parameter for cases where IP is unknown
      const url = `/api/posts/${postSlug}/likes${clientId ? `?clientId=${encodeURIComponent(clientId)}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLikesCount(data.count || 0);
        
        // Check localStorage as fallback
        if (typeof window !== "undefined") {
          const likeKey = `like_${postSlug}`;
          const storedLike = localStorage.getItem(likeKey);
          setHasLiked(data.hasLiked || storedLike === "true");
        } else {
          setHasLiked(data.hasLiked || false);
        }
      } else {
        // If API fails, check localStorage
        if (typeof window !== "undefined") {
          const likeKey = `like_${postSlug}`;
          const storedLike = localStorage.getItem(likeKey);
          setHasLiked(storedLike === "true");
        }
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
      // Fallback to localStorage
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
    fetchLikes();
  }, [postSlug, fetchLikes]);

  const handleToggleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Like button clicked", { toggling, loading, postSlug });
    
    if (toggling || loading) return;

    setToggling(true);
    try {
      // Get or create a client identifier for tracking likes
      let clientId = null;
      if (typeof window !== "undefined") {
        clientId = localStorage.getItem("clientId");
        if (!clientId) {
          // Generate a unique client ID
          clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem("clientId", clientId);
        }
      }

      const response = await fetch(`/api/posts/${postSlug}/likes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId }), // Send client ID to help with tracking
      });

      if (response.ok) {
        const data = await response.json();
        setLikesCount(data.count || 0);
        setHasLiked(data.liked || false);
        
        // Store like status in localStorage as backup
        if (typeof window !== "undefined") {
          const likeKey = `like_${postSlug}`;
          if (data.liked) {
            localStorage.setItem(likeKey, "true");
          } else {
            localStorage.removeItem(likeKey);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Error toggling like:", errorData);
        // Show user-friendly error message
        const errorMessage = errorData?.error || "Failed to like article. Please try again.";
        console.error("Like error details:", errorMessage);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <div className="animate-pulse">
          <FaRegHeart className="w-5 h-5" />
        </div>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggleLike}
      disabled={toggling}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative z-10 ${
        hasLiked
          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
      } ${toggling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{ pointerEvents: toggling ? "none" : "auto" }}
      aria-label={hasLiked ? "Unlike this post" : "Like this post"}
    >
      {hasLiked ? (
        <FaHeart className="w-5 h-5 fill-current" />
      ) : (
        <FaRegHeart className="w-5 h-5" />
      )}
      <span className="font-medium">
        {likesCount} {likesCount === 1 ? "like" : "likes"}
      </span>
    </button>
  );
}



