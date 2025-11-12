// Use Next.js API routes (same port as Next.js app)
// If NEXT_PUBLIC_API_URL is set, use it; otherwise use relative URLs for same-origin requests
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface ApiResponse<T = any> {
  message?: string;
  user?: T;
  token?: string;
  error?: string | any[];
}

// Helper function to get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// Helper function to set auth token in localStorage
export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

// Helper function to remove auth token from localStorage
export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

// API request helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fullUrl = `${API_URL}${endpoint}`;
  
  try {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔵 API Request: ${options.method || "GET"} ${fullUrl}`);
    }
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      if (process.env.NODE_ENV === 'development') {
        console.error("❌ Failed to parse JSON response:", jsonError);
        console.error(`❌ Response status: ${response.status}`);
      }
      throw new Error(`Invalid response from server. Status: ${response.status}`);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🟢 API Response:`, { status: response.status });
    }

    if (!response.ok) {
      const errorMessage = Array.isArray(data.error) 
        ? data.error.map((e: any) => e.msg || e.message || e).join(", ")
        : data.error || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error: any) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error("❌ API Request Error:", error?.message);
    }
    
    // Check for specific error types
    if (error instanceof TypeError && error.message.includes("fetch")) {
      const detailedError = process.env.NODE_ENV === 'development'
        ? `Failed to connect to server at ${fullUrl}. Check if server is running.`
        : `Network error. Please check your connection and try again.`;
      throw new Error(detailedError);
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Network error: ${error?.message || "Unknown error"}. Please check your connection and try again.`);
  }
};

// Auth API functions
export const authApi = {
  register: async (name: string, email: string, password: string) => {
    const response = await apiRequest<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    if (response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      setAuthToken(response.token);
    }

    return response;
  },

  getCurrentUser: async () => {
    return apiRequest<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>("/api/auth/me", {
      method: "GET",
    });
  },

  logout: () => {
    removeAuthToken();
  },
};

