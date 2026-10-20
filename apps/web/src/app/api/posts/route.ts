import { NextRequest, NextResponse } from "next/server";
import { getPosts, toSummary } from "@/lib/posts";

export function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().toLocaleLowerCase();
  const locale = request.nextUrl.searchParams.get("locale");
  const requestedPage = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const requestedPageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "20");
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = Number.isInteger(requestedPageSize) ? Math.min(50, Math.max(1, requestedPageSize)) : 20;
  const all = getPosts(locale || undefined)
    .filter((post) => !query || `${post.title} ${post.description} ${post.keywords.join(" ")}`.toLocaleLowerCase().includes(query))
    .map(toSummary);
  const start = (page - 1) * pageSize;
  return NextResponse.json({ posts: all.slice(start, start + pageSize), page, pageSize, total: all.length });
}
