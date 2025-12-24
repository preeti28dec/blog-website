"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { FaEdit, FaTrash } from "react-icons/fa";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    posts: number;
  };
}

export default function UsersManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    userId: string;
    userName: string;
    onConfirm: () => void;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN" as "SUPER_ADMIN" | "ADMIN" | "PUBLIC",
  });

  // Check authentication and role
  useEffect(() => {
    if (status === "loading") return;

    if (!session || !session.user) {
      router.push("/login");
      return;
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== "SUPER_ADMIN") {
      toast.error("Access denied. Super Admin only.");
      router.push("/admin");
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      // Update user
      try {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          const updatedUser = await response.json();
          // Update UI immediately without refresh
          setUsers(users.map(u => u.id === editingUser.id ? { ...updatedUser, _count: u._count } : u));
          toast.success("User updated successfully!");
          setShowForm(false);
          setEditingUser(null);
          resetForm();
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to update user");
        }
      } catch (error) {
        console.error("Error updating user:", error);
        toast.error("Failed to update user");
      }
    } else {
      // Create user
      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const newUser = await response.json();
          // Update UI immediately without refresh
          setUsers([...users, { ...newUser, _count: { posts: 0 } }]);
          toast.success("User created successfully!");
          setShowForm(false);
          resetForm();
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to create user");
        }
      } catch (error) {
        console.error("Error creating user:", error);
        toast.error("Failed to create user");
      }
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email,
      password: "",
      role: user.role as "SUPER_ADMIN" | "ADMIN" | "PUBLIC",
    });
    setShowForm(true);
  };

  const handleDelete = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    setDeleteModalConfig({
      userId: userId,
      userName: user.name || user.email,
      onConfirm: async () => {
        setShowDeleteModal(false);
        setDeletingUserId(userId);
        try {
          const response = await fetch(`/api/users/${userId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            // Update UI immediately without refresh
            setUsers(users.filter(u => u.id !== userId));
            toast.success("User deleted successfully!");
          } else {
            const error = await response.json();
            toast.error(error.error || "Failed to delete user");
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          toast.error("Failed to delete user");
        } finally {
          setDeletingUserId(null);
          setDeleteModalConfig(null);
        }
      }
    });
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "ADMIN",
    });
  };

  // Show loading while checking auth
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        <div className="text-center text-sm sm:text-base">Loading...</div>
      </div>
    );
  }

  // Show unauthorized if not logged in or wrong role
  if (!session || !session.user) {
    return null; // Will redirect
  }

  const userRole = (session.user as any)?.role;
  if (userRole !== "SUPER_ADMIN") {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
              Manage user accounts and permissions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/admin"
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center text-sm sm:text-base"
            >
              Back to Admin
            </Link>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingUser(null);
                resetForm();
              }}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              {showForm ? "Cancel" : "Create User"}
            </button>
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-6 sm:mb-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
              {editingUser ? "Edit User" : "Create New User"}
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                  Password {editingUser && <span className="text-xs">(leave empty to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                  minLength={6}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as "SUPER_ADMIN" | "ADMIN" | "PUBLIC",
                    })
                  }
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                >
                  <option value="PUBLIC">Public User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
              >
                {editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posts
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-gray-500 text-sm sm:text-base">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                        {user.name || "N/A"}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300 text-xs sm:text-sm break-all">
                        {user.email}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.role === "SUPER_ADMIN"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : user.role === "ADMIN"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                        {user._count.posts}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                              }
                            }}
                            disabled={deletingUserId === user.id}
                            className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            {deletingUserId === user.id ? (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <FaTrash className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteModalConfig && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
              setDeleteModalConfig(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowDeleteModal(false);
              setDeleteModalConfig(null);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete User
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete the user &quot;{deleteModalConfig.userName}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteModalConfig(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setShowDeleteModal(false);
                    setDeleteModalConfig(null);
                  }
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={deleteModalConfig.onConfirm}
                onKeyDown={(e) => {
                  // Prevent Enter key from triggering delete
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

