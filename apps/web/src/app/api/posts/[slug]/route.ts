import { NextRequest, NextResponse } from "next/server";
import { getPost } from "@/lib/posts";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";
  const post = getPost(slug, locale);
  return post
    ? NextResponse.json(post)
    : NextResponse.json({ error: "Post not found" }, { status: 404 });
}
