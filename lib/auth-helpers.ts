import { getServerSession } from "next-auth";
import { authOptions } from "./auth-config";
import { NextRequest, NextResponse } from "next/server";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "PUBLIC";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function getCurrentUserRole(): Promise<UserRole> {
  const user = await getCurrentUser();
  return (user as any)?.role || "PUBLIC";
}

export function hasRole(userRole: UserRole | null | undefined, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

export async function requireAuth(requiredRoles: UserRole[] = ["ADMIN", "SUPER_ADMIN"]) {
  const user = await getCurrentUser();
  const role = (user as any)?.role as UserRole | undefined;

  if (!user || !role) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Unauthorized - Login required" }, { status: 401 }),
    };
  }

  if (!hasRole(role, requiredRoles)) {
    return {
      authorized: false,
      error: NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    user,
    role,
  };
}

export async function requireSuperAdmin() {
  return requireAuth(["SUPER_ADMIN"]);
}

export async function requireAdmin() {
  return requireAuth(["ADMIN", "SUPER_ADMIN"]);
}


