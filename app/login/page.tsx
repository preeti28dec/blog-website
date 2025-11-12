"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi, getAuthToken } from "@/lib/api";
import { FaEye, FaEyeSlash, FaEnvelope, FaUser, FaLock } from "react-icons/fa";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const userData = await authApi.getCurrentUser();
        if (userData.user) {
          // User is already logged in, redirect to home
          router.push("/");
          return;
        }
        } catch (error) {
          // Token is invalid, clear it and allow login
          authApi.logout();
        }
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        console.log("Attempting login with email:", data.email);
        const response = await authApi.login(data.email, data.password);
        console.log("Login response:", response);
        
        if (response.user && response.token) {
          // Successfully logged in - redirect to home page
          console.log("Login successful, redirecting to home...");
          // Use window.location for immediate redirect
          window.location.href = "/";
        } else {
          // Handle different error types
          const errorMsg = response.error as string || "Invalid email or password";
          if (errorMsg.toLowerCase().includes("user") && errorMsg.toLowerCase().includes("exist")) {
            setError("An account with this email already exists. Please login instead.");
            // Suggest switching to login
            setTimeout(() => {
              setIsLogin(true);
              reset();
            }, 2000);
          } else {
            setError(errorMsg);
          }
        }
      } else {
        // Registration
        console.log("Attempting registration with:", { name: data.name, email: data.email });
        const response = await authApi.register(data.name, data.email, data.password);
        console.log("Registration response:", response);
        
        if (response.user && response.token) {
          // Successfully registered and logged in - redirect to home page
          setError("");
          // Use window.location for immediate redirect
          window.location.href = "/";
        } else {
          // Handle registration errors
          let errorMsg = "";
          if (Array.isArray(response.error)) {
            errorMsg = response.error.map((e: any) => e.msg || e.message || e).join(", ");
          } else {
            errorMsg = response.error || "Registration failed";
          }
          
          // Check if user already exists
          if (errorMsg.toLowerCase().includes("already exists") || 
              errorMsg.toLowerCase().includes("user already") ||
              errorMsg.toLowerCase().includes("email already")) {
            setError("An account with this email already exists. Please login instead.");
            // Suggest switching to login after 2 seconds
            setTimeout(() => {
              setIsLogin(true);
              reset();
            }, 2000);
          } else {
            setError(errorMsg);
          }
        }
      }
    } catch (error: any) {
      console.error("❌ Authentication error:", error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || "An error occurred. Please try again.";
      
      // Check for specific error types
      if (error.message?.toLowerCase().includes("already exists") ||
          error.message?.toLowerCase().includes("user already")) {
        errorMessage = "An account with this email already exists. Please login instead.";
        setTimeout(() => {
          setIsLogin(true);
          reset();
        }, 2000);
      } else if (error.message?.includes("Failed to connect") || 
                 error.message?.includes("fetch") ||
                 error.name === "TypeError") {
        errorMessage = "Connection failed. Please check if the server is running.";
      } else if (error.message?.includes("Invalid email or password") ||
                 error.message?.includes("Invalid credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="text-gray-600 dark:text-gray-400">Checking authentication...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">
            {isLogin ? "Login" : "Register"}
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }} 
            className="space-y-4"
          >
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <FaUser className="text-gray-500" />
                  Name
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message as string}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FaEnvelope className="text-gray-500" />
                Email
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  {...register("email")}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message as string}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FaLock className="text-gray-500" />
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FaEyeSlash className="w-5 h-5" />
                  ) : (
                    <FaEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message as string}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : isLogin ? "Login" : "Register"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                reset();
                setError("");
              }}
              className="text-blue-600 hover:underline"
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </button>
          </div>

          {error && error.includes("already exists") && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 Switching to login form...
              </p>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-600 hover:underline text-sm">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

