import { NextRequest, NextResponse } from "next/server";
import {
  getHomepage,
  getMovieInfo,
  getSources,
  getTrending,
  MovieApiError,
} from "@/lib/movie-api";

export const dynamic = "force-dynamic";

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
function validSubjectId(value: string | null): value is string {
  return !!value && /^[A-Za-z0-9_-]{1,100}$/.test(value);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const action = params.get("action");

  try {
    if (action === "homepage") {
      return NextResponse.json({ data: await getHomepage() });
    }
    if (action === "trending") {
      const page = Number(params.get("page") ?? 0);
      const perPage = Number(params.get("perPage") ?? 18);
      if (!Number.isFinite(page) || page < 0 || !Number.isFinite(perPage) || perPage < 1) {
        return bad("Page and page size must be positive numbers.");
      }
      return NextResponse.json({ data: await getTrending(page, perPage) });
    }
    if (action === "info") {
      const subjectId = params.get("subjectId");
      if (!validSubjectId(subjectId)) return bad("A valid subjectId is required.");
      return NextResponse.json({ data: await getMovieInfo(subjectId) });
    }
    if (action === "sources") {
      const subjectId = params.get("subjectId");
      const season = Number(params.get("season") ?? 1);
      const episode = Number(params.get("episode") ?? 1);
      if (!validSubjectId(subjectId)) return bad("A valid subjectId is required.");
      if (!Number.isFinite(season) || !Number.isFinite(episode) || season < 1 || episode < 1) {
        return bad("Season and episode must be positive numbers.");
      }
      return NextResponse.json({ data: await getSources(subjectId, season, episode) });
    }
    return bad("Unsupported MovieBox action. Supported actions: homepage, trending, info and sources.");
  } catch (error) {
    const status = error instanceof MovieApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "An unexpected server error occurred.";
    return NextResponse.json({ error: message }, { status });
  }
}
