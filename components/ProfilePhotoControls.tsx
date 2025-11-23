"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type ProfilePhotoControlsProps = {
  storedImage: string | null;
  variant?: "panel" | "inline" | "hero";
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function ProfilePhotoControls({
  storedImage,
  variant = "panel",
}: ProfilePhotoControlsProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role;
  const canEdit = role === "ADMIN" || role === "SUPER_ADMIN";

  const [currentValue, setCurrentValue] = useState<string | null>(
    storedImage ?? null
  );
  const [draftValue, setDraftValue] = useState<string | null>(
    storedImage ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(storedImage ?? null);
    setDraftValue(storedImage ?? null);
  }, [storedImage]);

  if (status === "loading" || !canEdit) {
    return null;
  }

  const previewSrc = draftValue;
  const previewIsDataUri = previewSrc?.startsWith("data:") ?? false;
  const hasChanges = draftValue !== currentValue;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("Image must be 5MB or smaller.");
      return;
    }

    setUploading(true);
    setUploadingFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      setDraftValue(data.url);
      toast.success("Photo ready to save.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Profile upload failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Unable to upload image."
      );
    } finally {
      setUploading(false);
      setUploadingFileName("");
    }
  };

  const handleRemove = () => {
    setDraftValue(null);
    toast.success("Photo removed. Save to publish the change.");
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl: draftValue ?? null }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "Failed to update profile" }));
        throw new Error(error.error || "Failed to update profile");
      }

      setCurrentValue(draftValue ?? null);
      toast.success("Profile photo updated.");
      router.refresh();
    } catch (error) {
      console.error("Profile save failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Unable to save profile photo."
      );
    } finally {
      setSaving(false);
    }
  };

  if (variant === "hero") {
    return (
      <div className="mt-6 space-y-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 rounded-full bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {uploading ? "Uploading..." : draftValue ? "Change photo" : "Upload photo"}
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading || (!draftValue && currentValue === null)}
            className="rounded-full border border-red-200 px-4 py-2 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            Remove
          </button>
        </div>

        {hasChanges && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            <button
              type="button"
              onClick={handleSave}
              disabled={uploading || saving}
              className="rounded-full bg-purple-600 px-4 py-2 font-semibold uppercase tracking-wide text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}

        <div className="space-y-1 text-[11px]">
          {uploading && (
            <p className="flex items-center gap-2 text-blue-600 dark:text-blue-300">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
              Uploading {uploadingFileName && <span className="truncate">{uploadingFileName}</span>}
            </p>
          )}
          {previewIsDataUri && (
            <p className="text-amber-600 dark:text-amber-300">
              Preview uses a data URL. Save it so visitors see the hosted version.
            </p>
          )}
          <p>Only admins see this. PNG/JPG up to 5MB.</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white/80 p-4 text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-200">
        <div className="flex gap-4">
          <div className="relative h-28 w-24 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            {uploading ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600" />
                <span>Uploading</span>
                {uploadingFileName && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                    {uploadingFileName}
                  </span>
                )}
              </div>
            ) : previewSrc ? (
              <Image
                src={previewSrc}
                alt="Profile preview"
                width={160}
                height={200}
                unoptimized={previewIsDataUri}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center text-[10px] text-gray-500 dark:text-gray-300">
                <svg
                  className="h-6 w-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7h18M3 7l3-4h12l3 4M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7"
                  />
                </svg>
                <span>No photo yet</span>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Update hero portrait
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Only admins see this. Upload vertical PNG/JPG up to 5MB.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {draftValue ? "Change photo" : "Upload photo"}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading || (!draftValue && currentValue === null)}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
              >
                Remove
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || uploading || saving}
                className="rounded-lg bg-purple-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : hasChanges ? "Save changes" : "All set"}
              </button>
              <button
                type="button"
                onClick={() => setDraftValue(currentValue)}
                disabled={!hasChanges || uploading || saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Discard
              </button>
            </div>
            {previewIsDataUri && (
              <p className="text-[11px] text-amber-600 dark:text-amber-300">
                Preview is using a data URL. Save to persist it for everyone.
              </p>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="mt-12 rounded-3xl border border-dashed border-gray-300 bg-white/70 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="w-full max-w-xs">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            {uploading ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-6 text-center text-sm text-gray-500 dark:text-gray-300">
                <span className="h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
                <p>Uploading photo...</p>
                {uploadingFileName && (
                  <p className="text-xs text-gray-400">{uploadingFileName}</p>
                )}
              </div>
            ) : previewSrc ? (
              <Image
                src={previewSrc}
                alt="Current profile preview"
                width={460}
                height={520}
                unoptimized={previewIsDataUri}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-indigo-100 p-6 text-center text-sm text-gray-500 dark:from-gray-800 dark:to-gray-900 dark:text-gray-300">
                <svg
                  className="h-10 w-10 text-blue-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11zM5 20c0-3.038 3.134-5.5 7-5.5s7 2.462 7 5.5"
                  />
                </svg>
                <p className="font-medium text-gray-700 dark:text-gray-100">No hero portrait yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Upload a vertical PNG/JPG up to 5MB to showcase on the About page.
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {draftValue ? "Change photo" : "Upload photo"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || (!draftValue && currentValue === null)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              Remove
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            PNG or JPG up to 5MB. Portrait/vertical images look best.
          </p>
        </div>

        <div className="flex-1 space-y-4 rounded-2xl border border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <p>
            Only admins see this panel. Upload a new portrait or remove it to fall back
            to the default illustration. Saving will instantly refresh the hero photo for
            all visitors.
          </p>
          {previewIsDataUri && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
              Preview is using a data URL. Saving will store it so everyone sees the new
              photo without re-uploading.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || uploading || saving}
              className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : hasChanges ? "Save changes" : "All set"}
            </button>
            <button
              type="button"
              onClick={() => setDraftValue(currentValue)}
              disabled={!hasChanges || uploading || saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Discard changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


