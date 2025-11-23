import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PROFILE_KEY, defaultProfileRecord } from "@/lib/profile";
import { revalidatePath } from "next/cache";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
};

const profileSchema = z.object({
  imageUrl: z
    .string()
    .trim()
    .refine(
      (val) =>
        val === "" ||
        val.startsWith("http://") ||
        val.startsWith("https://") ||
        val.startsWith("data:"),
      {
        message: "Image URL must be an http(s) link or data URI",
      }
    )
    .nullish(),
});

export async function GET() {
  try {
    const profile = await prisma.profile.findUnique({
      where: { key: PROFILE_KEY },
    });
    return NextResponse.json(profile ?? defaultProfileRecord);
  } catch (error) {
    console.error("[profile][GET] Failed to load profile", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { requireAdmin } = await import("@/lib/auth-helpers");
    const authResult = await requireAdmin();
    if (!authResult.authorized) {
      return authResult.error;
    }

    const json = await request.json();
    const parsed = profileSchema.parse(json);
    const normalizedImage =
      parsed.imageUrl && parsed.imageUrl.trim() !== ""
        ? parsed.imageUrl.trim()
        : null;

    const profile = await prisma.profile.upsert({
      where: { key: PROFILE_KEY },
      create: {
        key: PROFILE_KEY,
        imageUrl: normalizedImage,
      },
      update: {
        imageUrl: normalizedImage,
      },
    });

    revalidatePath("/about");
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[profile][PUT] Failed to update profile", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues?.[0]?.message ?? "Invalid payload" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}


