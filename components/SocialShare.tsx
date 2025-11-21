"use client";

interface SocialShareProps {
  title: string;
  url: string;
  description?: string;
}

export default function SocialShare({ title, url, description }: SocialShareProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || "");

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=400");
  };

  return (
    <div className="flex gap-3 items-center py-4 border-t border-b border-gray-200 dark:border-gray-700 my-8">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Share this article
      </span>
      <button
        onClick={() => handleShare("twitter")}
        className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
        aria-label="Share on Twitter"
      >
        Twitter
      </button>
      <button
        onClick={() => handleShare("facebook")}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        aria-label="Share on Facebook"
      >
        Facebook
      </button>
      <button
        onClick={() => handleShare("linkedin")}
        className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm"
        aria-label="Share on LinkedIn"
      >
        LinkedIn
      </button>
      <button
        onClick={() => handleShare("whatsapp")}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
        aria-label="Share on WhatsApp"
      >
        WhatsApp
      </button>
    </div>
  );
}




