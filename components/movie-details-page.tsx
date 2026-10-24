"use client";

import { useEffect, useState } from "react";
import type { MovieDetails, SourceResult } from "@/lib/movie-api";
import { Icon } from "@/components/icons";
import { WATCHLIST_KEY } from "@/components/movie-card";

type Props = { subjectId: string };
async function api<T>(query: string): Promise<T> {
  const response = await fetch(`/api/movies?${query}`, { cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Request failed. Please try again.");
  return body.data as T;
}

export default function MovieDetailsPage({ subjectId }: Props) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [hasRights, setHasRights] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState("");
  const [sourceData, setSourceData] = useState<SourceResult | null>(null);

  const loadDetails = async () => {
    setLoading(true); setError("");
    try { setDetails(await api<MovieDetails>(`action=info&subjectId=${encodeURIComponent(subjectId)}`)); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load this title."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadDetails(); }, [subjectId]);
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
      setSaved(Array.isArray(list) && list.some((item) => item?.subjectId === subjectId));
    } catch { setSaved(false); }
  }, [subjectId]);

  const toggleSaved = () => {
    if (!details) return;
    try {
      const list = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || "[]");
      const previous = Array.isArray(list) ? list : [];
      const next = saved ? previous.filter((item) => item?.subjectId !== subjectId) : [details.movie, ...previous.filter((item) => item?.subjectId !== subjectId)];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
      setSaved(!saved);
    } catch { setError("Your browser could not save this title to the local watchlist."); }
  };

  const loadSources = async () => {
    setSourceLoading(true); setSourceError("");
    try { setSourceData(await api<SourceResult>(`action=sources&subjectId=${encodeURIComponent(subjectId)}&season=1&episode=1`)); }
    catch (e) { setSourceError(e instanceof Error ? e.message : "Download links are unavailable right now."); }
    finally { setSourceLoading(false); }
  };

  if (loading) return <div className="page-content"><div className="detail-back"><Icon name="chevron" size={13} style={{ transform: "rotate(180deg)" }} />Back to discovery</div><div className="detail-hero"><div className="skeleton detail-poster" /><div><div className="skeleton" style={{ height: 13, width: 100 }} /><div className="skeleton" style={{ height: 38, width: "75%", marginTop: 16 }} /><div className="skeleton" style={{ height: 12, width: "90%", marginTop: 22 }} /></div></div></div>;
  if (error && !details) return <div className="page-content"><a href="/" className="detail-back"><Icon name="chevron" size={13} style={{ transform: "rotate(180deg)" }} />Back to discovery</a><div className="error-state"><Icon name="info" size={24} /><strong>Title details unavailable</strong><p>{error}</p><button className="button-secondary" onClick={() => void loadDetails()}><Icon name="refresh" size={14} />Try again</button></div></div>;
  if (!details) return null;

  const { movie, people } = details;
  const sourceList = sourceData?.sources ?? [];
  const availableSources = sourceList.filter((source) => source.downloadUrl);
  const sizeLabel = (size: number | null) => size === null ? "Size unavailable" : size >= 1024 ? `${(size / 1024).toFixed(1)} GB` : `${size.toFixed(0)} MB`;

  return (
    <div className="page-content">
      <a href="/" className="detail-back"><Icon name="chevron" size={13} style={{ transform: "rotate(180deg)" }} />Back to discovery</a>
      <section className="detail-hero">
        {movie.cover && <div className="detail-bg" style={{ backgroundImage: `url("${movie.cover.replaceAll('"', '')}")` }} />}
        {movie.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="detail-poster" src={movie.cover} alt={`${movie.title} poster`} />
        ) : <div className="detail-poster poster-empty">Artwork unavailable</div>}
        <div className="detail-copy">
          <div className="eyebrow">MovieBox title details</div>
          <h1>{movie.title}</h1>
          <div className="meta-line">
            {movie.year && <span>{movie.year}</span>}{movie.year && movie.genre.length > 0 && <i className="meta-dot" />}
            {movie.country && <span>{movie.country}</span>}{movie.country && movie.rating !== null && <i className="meta-dot" />}
            {movie.rating !== null && <span className="rating-pill"><Icon name="star" size={12} />{movie.rating.toFixed(1)}{movie.ratingCount ? ` · ${movie.ratingCount.toLocaleString()} ratings` : ""}</span>}
          </div>
          <p className="hero-desc">{movie.description || "No description was provided by the MovieBox API for this title."}</p>
          <div className="genre-pills">{movie.genre.length ? movie.genre.map((item) => <span className="genre-pill" key={item}>{item}</span>) : <span className="genre-pill">Genre not listed</span>}</div>
          <div className="hero-actions">
            <button className="button-secondary" onClick={toggleSaved}><Icon name="bookmark" size={15} />{saved ? "Saved to watchlist" : "Add to watchlist"}</button>
            <span className="search-caption" style={{ margin: 0 }}>{movie.hasResource ? "Sources may be available" : "No resource availability reported"}</span>
          </div>
        </div>
      </section>

      <section className="download-panel" aria-labelledby="download-heading">
        <h2 id="download-heading">Available downloads</h2>
        <p>Download sources are requested only after you confirm that you have permission to access the content. This app does not play or proxy video.</p>
        <label className="rights-check">
          <input type="checkbox" checked={hasRights} onChange={(event) => { setHasRights(event.target.checked); if (!event.target.checked) setSourceData(null); }} />
          <span>I confirm I am authorized to access or download this title and will follow applicable rights and terms.</span>
        </label>
        <div style={{ marginTop: 14 }}>
          <button className="button-primary" disabled={!hasRights || sourceLoading} onClick={() => void loadSources()}>
            <Icon name={sourceLoading ? "refresh" : "download"} size={15} />{sourceLoading ? "Checking sources…" : sourceData ? "Refresh download links" : "Check available links"}
          </button>
        </div>
        {sourceError && <div className="notice" role="alert">{sourceError} Signed source links can expire. You can try refreshing them later.</div>}
        {sourceData && !availableSources.length && <div className="empty-state" style={{ minHeight: 110 }}><strong>No validated download links returned</strong><p>The API did not provide an HTTPS proxy link on the configured trusted host for this title. No direct upstream URLs were exposed.</p></div>}
        {availableSources.length > 0 && <div className="source-list">
          {availableSources.map((source, index) => <div className="source-row" key={source.id || `${source.quality}-${index}`}>
            <div className="source-label"><span className="quality-badge">{source.quality}</span><div><strong>{source.format || "File"}</strong><br /><small>{sizeLabel(source.sizeMB)}</small></div></div>
            <a className="button-primary" href={source.downloadUrl ?? undefined} target="_blank" rel="noopener noreferrer"><Icon name="download" size={14} />Open download</a>
          </div>)}
        </div>}
        <div className="notice">Links are supplied by the source API, may expire or redirect, and are opened directly in your browser. Check local law and the provider’s terms before use.</div>
      </section>

      {people.length > 0 && <section className="section">
        <div className="section-heading"><div><h2 className="section-title"><span className="title-icon"><Icon name="film" size={18} /></span>Cast &amp; crew</h2><p className="section-subtitle">People listed in the MovieBox details response.</p></div></div>
        <div className="poster-grid people-grid">{people.slice(0, 6).map((person, index) => <div className="person-card" key={`${person.name}-${index}`}>
          {person.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.avatar} alt={person.name} loading="lazy" />
          ) : <div className="person-placeholder">{person.name.slice(0, 1).toUpperCase()}</div>}
          <strong>{person.name}</strong><span>{person.role || "Cast & crew"}</span>
        </div>)}</div>
      </section>}
      <footer className="footer-note">No playback, subtitles, or episode selector are included. The provided API documentation confirms homepage, trending, subject information and source-list actions, but not a playback or episode-navigation contract.</footer>
    </div>
  );
}
