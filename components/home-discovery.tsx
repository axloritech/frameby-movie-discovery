"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Movie, PageResult } from "@/lib/movie-api";
import { Icon } from "@/components/icons";
import { PosterGrid, WATCHLIST_KEY } from "@/components/movie-card";

const PAGE_SIZE = 18;
type ViewMode = "home" | "discover" | "trending" | "saved";

async function api<T>(query: string): Promise<T> {
  const response = await fetch(`/api/movies?${query}`, { cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong while loading titles.");
  return body.data as T;
}
function uniqueMovies(list: Movie[]) {
  const seen = new Set<string>();
  return list.filter((movie) => {
    if (!movie?.subjectId || seen.has(movie.subjectId)) return false;
    seen.add(movie.subjectId);
    return true;
  });
}
function loadSaved(): Movie[] {
  try {
    const value = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
    return Array.isArray(value) ? value.filter((item) => item && typeof item.subjectId === "string" && typeof item.title === "string") as Movie[] : [];
  } catch { return []; }
}

function LoadingGrid() {
  return <div className="poster-grid">{Array.from({ length: 6 }, (_, index) => <div key={index}><div className="skeleton skeleton-poster" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line" style={{ width: "48%" }} /></div>)}</div>;
}

export default function HomeDiscovery() {
  const [featured, setFeatured] = useState<Movie[]>([]);
  const [trending, setTrending] = useState<Movie[]>([]);
  const [saved, setSaved] = useState<Movie[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [homeError, setHomeError] = useState("");
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [view, setView] = useState<ViewMode>("home");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery((params.get("q") || "").trim());
    setGenre((params.get("genre") || "").trim());
    const requestedView = params.get("view");
    if (requestedView === "trending" || requestedView === "discover" || requestedView === "saved") setView(requestedView);
    setSaved(loadSaved());
  }, []);

  const loadFirstPage = useCallback(async () => {
    setLoading(true); setError(""); setHomeError("");
    const homeTask = api<Movie[]>("action=homepage");
    const trendTask = api<PageResult>(`action=trending&page=0&perPage=${PAGE_SIZE}`);
    const [homeResult, trendResult] = await Promise.allSettled([homeTask, trendTask]);
    if (homeResult.status === "fulfilled") setFeatured(homeResult.value);
    else setHomeError(homeResult.reason instanceof Error ? homeResult.reason.message : "Could not load featured titles.");
    if (trendResult.status === "fulfilled") {
      setTrending(trendResult.value.subjects);
      setPage(0);
      // The API's total currently reflects returned page size. A full page means
      // another documented page can be requested; an empty/short page ends the feed.
      setHasMore(trendResult.value.subjects.length === PAGE_SIZE);
    } else {
      setError(trendResult.reason instanceof Error ? trendResult.reason.message : "Could not load trending titles.");
    }
    if (homeResult.status === "rejected" && trendResult.status === "rejected") {
      setError(trendResult.reason instanceof Error ? trendResult.reason.message : "Could not connect to the MovieBox API.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadFirstPage(); }, [loadFirstPage]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const result = await api<PageResult>(`action=trending&page=${next}&perPage=${PAGE_SIZE}`);
      const nextUnique = uniqueMovies([...trending, ...result.subjects]);
      setTrending(nextUnique);
      setPage(next);
      setHasMore(result.subjects.length === PAGE_SIZE);
      if (!result.subjects.length) setHasMore(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load another page.");
    } finally { setLoadingMore(false); }
  };

  const toggleSaved = (movie: Movie) => {
    setSaved((previous) => {
      const exists = previous.some((item) => item.subjectId === movie.subjectId);
      const next = exists ? previous.filter((item) => item.subjectId !== movie.subjectId) : [movie, ...previous];
      try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next)); } catch { /* Storage is optional. */ }
      return next;
    });
  };

  const allLoaded = useMemo(() => uniqueMovies([...featured, ...trending]), [featured, trending]);
  const list = useMemo(() => {
    let base = view === "saved" ? saved : view === "home" ? allLoaded : trending;
    if (genre) base = base.filter((movie) => movie.genre.some((item) => item.toLowerCase().includes(genre.toLowerCase())));
    if (query) {
      const q = query.toLowerCase();
      base = base.filter((movie) => [movie.title, movie.description, movie.country, ...movie.genre].join(" ").toLowerCase().includes(q));
    }
    return uniqueMovies(base);
  }, [allLoaded, genre, query, saved, trending, view]);

  const heroMovies = featured.length ? featured : trending;
  const hero = heroMovies[heroIndex % Math.max(1, heroMovies.length)];
  const genres = useMemo(() => [...new Set(allLoaded.flatMap((movie) => movie.genre))].sort((a, b) => a.localeCompare(b)), [allLoaded]);
  const bestRated = useMemo(() => [...allLoaded].filter((movie) => movie.rating !== null).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 6), [allLoaded]);
  const sectionTitle = view === "saved" ? "My watchlist" : query ? `Results for “${query}”` : genre ? genre : view === "trending" ? "Trending now" : view === "discover" ? "Discover titles" : "Trending now";

  return (
    <div className="page-content">
      {view === "home" && !query && !genre && hero && (
        <section className="hero" aria-label="Featured title">
          <div className="hero-image" style={hero.cover ? { backgroundImage: `url("${hero.cover.replaceAll('"', '')}")` } : undefined} />
          <div className="hero-copy">
            <div className="eyebrow">Featured from MovieBox</div>
            <h1>{hero.title}</h1>
            <p className="hero-desc">{hero.description || "A title picked from the live MovieBox featured collection. Open the details to explore more."}</p>
            <div className="meta-line">
              {hero.year && <span>{hero.year}</span>}{hero.year && hero.genre[0] && <i className="meta-dot" />}
              {hero.genre.slice(0, 2).map((item, i) => <span key={item} className="inline-meta">{i > 0 && <i className="meta-dot" />}{item}</span>)}
              {hero.rating !== null && <span className="rating-pill"><Icon name="star" size={12} />{hero.rating.toFixed(1)}</span>}
            </div>
            <div className="hero-actions">
              <a className="button-primary" href={`/title/${encodeURIComponent(hero.subjectId)}`}><Icon name="info" size={15} />View details</a>
              <button className="button-secondary" onClick={() => toggleSaved(hero)}><Icon name="bookmark" size={15} />{saved.some((item) => item.subjectId === hero.subjectId) ? "In watchlist" : "Add to watchlist"}</button>
            </div>
          </div>
          {heroMovies.length > 1 && <>
            <div className="hero-pagination">{heroMovies.slice(0, 5).map((_, index) => <i key={index} className={index === heroIndex % heroMovies.length ? "active" : ""} />)}</div>
            <div className="hero-arrows"><button className="hero-arrow" aria-label="Previous featured title" onClick={() => setHeroIndex((heroIndex + heroMovies.length - 1) % heroMovies.length)}><Icon name="chevron" size={16} style={{ transform: "rotate(180deg)" }} /></button><button className="hero-arrow" aria-label="Next featured title" onClick={() => setHeroIndex((heroIndex + 1) % heroMovies.length)}><Icon name="chevron" size={16} /></button></div>
          </>}
        </section>
      )}

      <section className="section">
        <div className="section-heading">
          <div><h2 className="section-title"><span className="title-icon"><Icon name={view === "saved" ? "bookmark" : "fire"} size={19} /></span>{sectionTitle}</h2>
            {query && <p className="section-subtitle">Filtering titles already loaded from the documented homepage and trending feeds.</p>}
            {!query && view !== "saved" && <p className="section-subtitle">Live picks, refreshed from the MovieBox-pro2 API.</p>}
          </div>
          {!query && !genre && view === "home" && <a className="see-all" href="/?view=trending">See all <Icon name="chevron" size={13} /></a>}
        </div>

        {view !== "saved" && <div className="filter-bar" aria-label="Filter by genre">
          <button className={`filter-chip ${!genre ? "active" : ""}`} onClick={() => setGenre("")}>All genres</button>
          {genres.slice(0, 12).map((item) => <button key={item} className={`filter-chip ${genre.toLowerCase() === item.toLowerCase() ? "active" : ""}`} onClick={() => setGenre(genre.toLowerCase() === item.toLowerCase() ? "" : item)}>{item}</button>)}
        </div>}

        {loading && !allLoaded.length ? <LoadingGrid /> : error && !allLoaded.length ? (
          <div className="error-state"><Icon name="info" size={24} /><strong>We couldn’t load the discovery feed</strong><p>{error}</p><button className="button-secondary" onClick={() => void loadFirstPage()}><Icon name="refresh" size={14} />Try again</button></div>
        ) : list.length ? <PosterGrid movies={list} savedIds={new Set(saved.map((item) => item.subjectId))} onToggleSaved={toggleSaved} /> : (
          <div className="empty-state"><Icon name={view === "saved" ? "bookmark" : "search"} size={25} /><strong>{view === "saved" ? "Your watchlist is empty" : "No titles found in the loaded feed"}</strong><p>{view === "saved" ? "Save titles with the bookmark button and they’ll be waiting here on this device." : query ? "This API route does not expose a keyword-search action. Try another term, clear filters, or load another trending page." : "Try another genre or clear the active filter."}</p>{view === "saved" && <a className="button-secondary" href="/">Browse titles</a>}</div>
        )}
        {error && allLoaded.length > 0 && <p className="search-caption" role="status">Some feed data could not be refreshed: {error}</p>}
        {view !== "saved" && hasMore && !loading && <div className="load-more"><button className="button-secondary" onClick={() => void loadMore()} disabled={loadingMore}>{loadingMore ? "Loading more…" : "Load more titles"}{!loadingMore && <Icon name="chevron" size={14} style={{ transform: "rotate(90deg)" }} />}</button></div>}
      </section>

      {view === "home" && !query && !genre && bestRated.length > 0 && <section className="section">
        <div className="section-heading"><div><h2 className="section-title"><span className="title-icon"><Icon name="star" size={18} /></span>Highest rated</h2><p className="section-subtitle">Ranked by ratings returned in the live feed.</p></div><a className="see-all" href="/?view=discover">Discover <Icon name="chevron" size={13} /></a></div>
        <PosterGrid movies={bestRated} savedIds={new Set(saved.map((item) => item.subjectId))} onToggleSaved={toggleSaved} />
      </section>}

      {homeError && !loading && <p className="search-caption" role="status">Featured picks unavailable: {homeError}</p>}
      <footer className="footer-note">Frameby is a discovery interface for API-provided metadata. Availability, rights, and download access are controlled by the source provider; links may expire. This app does not stream video or provide a keyword-search endpoint.</footer>
    </div>
  );
}
