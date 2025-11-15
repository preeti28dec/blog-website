import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1),
  authorName: z.string().min(1),
  authorEmail: z.string().email(),
});

// GET comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: params.slug },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId: post.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST create comment
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    const validatedData = commentSchema.parse(body);

    const post = await prisma.post.findUnique({
      where: { slug: params.slug },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        ...validatedData,
        postId: post.id,
        approved: true, // Comments are automatically approved
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}




