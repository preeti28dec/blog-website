"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SetupPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const router = useRouter();

  const handleCreateSuperAdmin = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/setup/create-super-admin", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setCredentials(data.credentials);
        toast.success("Super admin account created!");
      } else {
        toast.error(data.error || "Failed to create super admin.");
        if (data.message) {
          toast(data.message, { icon: "ℹ️" });
        }
      }
    } catch (error) {
      console.error("Error creating super admin:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
            Create Super Admin
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
            Generate the first super admin account to unlock the dashboard.
          </p>

          {credentials ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✅ Super Admin Created Successfully!
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">
                      Email:
                    </span>{" "}
                    <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">
                      {credentials.email}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">
                      Password:
                    </span>{" "}
                    <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">
                      {credentials.password}
                    </code>
                  </div>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400 mt-3 font-medium">
                  ⚠️ Please change the password after first login!
                </p>
              </div>

              <Link
                href="/login"
                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleCreateSuperAdmin}
                disabled={isCreating}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
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
                    Creating...
                  </>
                ) : (
                  "Create Super Admin"
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Already have an account? Login
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-gray-600 dark:text-gray-400 hover:underline text-sm"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

