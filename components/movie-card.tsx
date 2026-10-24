"use client";

import { useState } from "react";
import type { Movie } from "@/lib/movie-api";
import { Icon } from "@/components/icons";

export const WATCHLIST_KEY = "frameby-watchlist-v1";

type Props = { movie: Movie; saved?: boolean; onToggleSaved?: (movie: Movie) => void };

export function MovieCard({ movie, saved = false, onToggleSaved }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <article className="poster-card">
      <div className="poster-art">
        <a href={`/title/${encodeURIComponent(movie.subjectId)}`} aria-label={`View details for ${movie.title}`}>
          {movie.cover && !imageFailed ? (
            // Source image URLs are provided by the MovieBox API and are normalized to HTTPS.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={movie.cover} alt={`${movie.title} poster`} loading="lazy" onError={() => setImageFailed(true)} />
          ) : <div className="poster-empty"><span>{movie.title}</span></div>}
          <div className="poster-shade" />
          {movie.rating !== null && <span className="poster-rating"><Icon name="star" size={11} />{movie.rating.toFixed(1)}</span>}
        </a>
        {onToggleSaved && (
          <button className={`poster-save ${saved ? "is-saved" : ""}`} onClick={() => onToggleSaved(movie)} aria-label={saved ? `Remove ${movie.title} from watchlist` : `Save ${movie.title}`} title={saved ? "Remove from watchlist" : "Save to watchlist"}>
            <Icon name="bookmark" size={13} />
          </button>
        )}
      </div>
      <a href={`/title/${encodeURIComponent(movie.subjectId)}`}>
        <span className="poster-title" title={movie.title}>{movie.title}</span>
        <span className="poster-meta"><span>{movie.year || "Year unavailable"}</span>{movie.genre[0] && <><i />{movie.genre[0]}</>}</span>
      </a>
    </article>
  );
}

export function PosterGrid({ movies, savedIds, onToggleSaved }: { movies: Movie[]; savedIds?: Set<string>; onToggleSaved?: (movie: Movie) => void }) {
  return <div className="poster-grid">{movies.map((movie) => <MovieCard key={movie.subjectId} movie={movie} saved={savedIds?.has(movie.subjectId)} onToggleSaved={onToggleSaved} />)}</div>;
}
