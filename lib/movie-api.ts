import "server-only";

/**
 * Central MovieBox-pro2 adapter. The only remote actions used here are the four
 * documented operations: homepage, trending, info and sources.
 */
export const API_CONFIG = {
  baseUrl:
    process.env.MOVIEBOX_API_BASE_URL ??
    "https://api.omegatech.app/api/movie/MovieBox-pro2",
  // MovieBox-pro2 returns its download proxy on this HTTPS host. We deliberately
  // do not allow direct upstream resource URLs or arbitrary URLs from the payload.
  trustedDownloadHosts: ["stream.omegatech.app"],
  defaultPageSize: 18,
  maxPageSize: 40,
} as const;

export type Movie = {
  subjectId: string;
  subjectType?: number;
  title: string;
  description: string;
  releaseDate: string;
  year: string;
  genre: string[];
  cover: string;
  rating: number | null;
  ratingCount: number | null;
  country: string;
  hasResource: boolean;
  detailPath: string;
};

export type PageResult = {
  page: number;
  perPage: number;
  total: number;
  subjects: Movie[];
};

export type MovieDetails = {
  movie: Movie;
  people: Array<{ name: string; role: string; avatar: string }>;
};

export type DownloadSource = {
  id: string;
  quality: string;
  format: string;
  sizeMB: number | null;
  downloadUrl: string | null;
};

export type SourceResult = {
  subjectId: string;
  season: number;
  episode: number;
  sources: DownloadSource[];
};

export class MovieApiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "MovieApiError";
    this.status = status;
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown, fallback = ""): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : fallback;
}
function numberOrNull(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function safeHttpsImage(value: unknown): string {
  const url = typeof value === "string" ? value : text(record(value).url);
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}
function normalizeGenres(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((entry) => text(entry)).filter(Boolean);
  return text(value)
    .split(/[,|]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function normalizeMovie(value: unknown): Movie | null {
  const raw = record(value);
  const subjectId = text(raw.subjectId);
  const title = text(raw.title);
  if (!subjectId || !title) return null;

  const releaseDate = text(raw.releaseDate);
  const yearMatch = releaseDate.match(/\b(\d{4})\b/);
  const year = yearMatch?.[1] ?? "";
  const cover = safeHttpsImage(raw.cover);
  const rating = numberOrNull(raw.rating ?? raw.imdbRatingValue);
  const count = numberOrNull(raw.ratingCount ?? raw.imdbRatingCount);

  return {
    subjectId,
    subjectType: typeof raw.subjectType === "number" ? raw.subjectType : undefined,
    title,
    description: text(raw.description),
    releaseDate,
    year,
    genre: normalizeGenres(raw.genre),
    cover,
    rating,
    ratingCount: count,
    country: text(raw.country ?? raw.countryName),
    hasResource: raw.hasResource === true,
    detailPath: text(raw.detailPath),
  };
}

function getData(payload: unknown): Record<string, unknown> {
  const root = record(payload);
  if (root.success === false || (typeof root.statusCode === "number" && root.statusCode >= 400)) {
    throw new MovieApiError(text(root.message, "The MovieBox API returned an error."), 502);
  }
  const data = record(root.data);
  if (!Object.keys(data).length) throw new MovieApiError("The MovieBox API returned an unexpected response.");
  return data;
}

async function request(action: "homepage" | "trending" | "info" | "sources", params: Record<string, string | number> = {}) {
  let url: URL;
  try {
    url = new URL(API_CONFIG.baseUrl);
  } catch {
    throw new MovieApiError("MOVIEBOX_API_BASE_URL must be a valid URL.", 500);
  }
  url.searchParams.set("action", action);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MovieBoxDiscover/1.0 (API client)",
        Referer: "https://api.omegatech.app/",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(18_000),
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "The MovieBox API took too long to respond. Please try again."
      : "Could not reach the MovieBox API. Check your connection and try again.";
    throw new MovieApiError(message, 502);
  }
  if (!response.ok) {
    throw new MovieApiError(
      response.status === 429
        ? "The MovieBox API is receiving too many requests. Please wait a moment and retry."
        : `The MovieBox API request failed (${response.status}). Please try again later.`,
      response.status === 429 ? 429 : 502,
    );
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MovieApiError("The MovieBox API returned invalid JSON.");
  }
  return getData(payload);
}

export async function getHomepage() {
  const data = await request("homepage");
  const rawItems = Array.isArray(data.topPickList) ? data.topPickList : [];
  return rawItems.map(normalizeMovie).filter((movie): movie is Movie => movie !== null);
}

export async function getTrending(page = 0, perPage: number = API_CONFIG.defaultPageSize): Promise<PageResult> {
  const safePage = Math.max(0, Math.floor(page));
  const safeSize = Math.min(API_CONFIG.maxPageSize, Math.max(1, Math.floor(perPage)));
  const data = await request("trending", { page: safePage, perPage: safeSize });
  const rawSubjects = Array.isArray(data.subjects) ? data.subjects : [];
  const subjects = rawSubjects.map(normalizeMovie).filter((movie): movie is Movie => movie !== null);
  return {
    page: Number(data.page) || safePage,
    perPage: Number(data.perPage) || safeSize,
    total: Number.isFinite(Number(data.total)) ? Number(data.total) : subjects.length,
    subjects,
  };
}

export async function getMovieInfo(subjectId: string): Promise<MovieDetails> {
  const data = await request("info", { subjectId });
  const movie = normalizeMovie(data.subject);
  if (!movie) throw new MovieApiError("No movie details were returned for this title.", 404);
  const peopleRaw = Array.isArray(data.stars) ? data.stars : [];
  const people = peopleRaw
    .map((entry) => {
      const person = record(entry);
      return {
        name: text(person.name),
        role: text(person.character),
        avatar: safeHttpsImage(person.avatar),
      };
    })
    .filter((person) => person.name)
    .slice(0, 12);
  return { movie, people };
}

function isTrustedDownloadUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !API_CONFIG.trustedDownloadHosts.some((host) => host === url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function getSources(subjectId: string, season = 1, episode = 1): Promise<SourceResult> {
  const safeSeason = Math.max(1, Math.floor(season));
  const safeEpisode = Math.max(1, Math.floor(episode));
  const data = await request("sources", { subjectId, season: safeSeason, episode: safeEpisode });
  const rawSources = Array.isArray(data.processedSources) ? data.processedSources : [];
  const sources = rawSources.map((entry) => {
    const item = record(entry);
    return {
      id: text(item.id),
      quality: text(item.quality, "Quality unavailable"),
      format: text(item.format).toUpperCase(),
      sizeMB: numberOrNull(item.sizeMB),
      // Do not expose direct upstream URLs. Only the API's HTTPS proxy is allowed.
      downloadUrl: isTrustedDownloadUrl(item.proxyDownloadUrl),
    };
  });
  return {
    subjectId: text(data.subjectId, subjectId),
    season: Number(data.season) || safeSeason,
    episode: Number(data.episode) || safeEpisode,
    sources,
  };
}
