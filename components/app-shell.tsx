"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Icon, IconName } from "@/components/icons";

const genres = ["Action", "Adventure", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller", "Romance", "Animation"];

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") || "");
  }, []);
  const nav = (label: string, icon: IconName, href: string, active = false) => (
    <a className={`side-link ${active ? "side-link-active" : ""}`} href={href} onClick={() => setMobileOpen(false)} key={label}>
      <Icon name={icon} size={18} /><span>{label}</span>
    </a>
  );
  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = query.trim();
    window.location.href = clean ? `/?q=${encodeURIComponent(clean)}` : "/";
  };

  return (
    <div className="app-frame">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)}><Icon name="menu" size={21} /></button>
        <a href="/" className="brand" aria-label="Frame home">
          <span className="brand-mark"><Icon name="play" size={19} /></span>
          <span className="brand-copy"><strong>frame<span>by</span></strong><small>DISCOVER WHAT MOVES YOU</small></span>
        </a>
        <form className="search-form" onSubmit={onSearch} role="search">
          <Icon name="search" size={19} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles in this discovery feed..." aria-label="Search titles in loaded results" />
          <span className="search-hint">ENTER</span>
        </form>
        <div className="header-actions">
          <a className="icon-button header-bell" href="/?view=trending" aria-label="Explore trending"><Icon name="bell" size={19} /></a>
          <span className="header-divider" />
          <a className="profile-chip" href="/?view=saved" aria-label="Open saved titles"><span className="profile-avatar">F</span><span>MY FRAME</span></a>
        </div>
      </header>

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="side-group-label">YOUR SPACE</div>
        {nav("Home", "home", "/", true)}
        {nav("Discover", "grid", "/?view=discover")}
        {nav("Trending", "fire", "/?view=trending")}
        {nav("My watchlist", "bookmark", "/?view=saved")}
        <div className="side-rule" />
        <div className="side-heading"><span>Genres</span><Icon name="filter" size={15} /></div>
        <div className="genre-nav">
          {genres.map((genre) => <a href={`/?genre=${encodeURIComponent(genre)}`} key={genre}><span className="genre-dot" />{genre}</a>)}
        </div>
        <div className="side-note">
          <div className="side-note-art"><Icon name="spark" size={21} /></div>
          <strong>Find your next favorite.</strong>
          <p>A fresh mix of films and series, pulled live from the MovieBox discovery feed.</p>
          <a href="/?view=trending">Explore trending <Icon name="arrow" size={14} /></a>
        </div>
        <div className="side-footer">Powered by MovieBox-pro2<br />A discovery experience</div>
      </aside>

      <main className="main-area" onClick={() => mobileOpen && setMobileOpen(false)}>{children}<footer className="brand-footer">Built by Axloritech</footer></main>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <a href="/" className="mobile-tab"><Icon name="home" size={18} /><span>Home</span></a>
        <a href="/?view=trending" className="mobile-tab"><Icon name="fire" size={18} /><span>Trending</span></a>
        <a href="/?view=discover" className="mobile-tab"><Icon name="grid" size={18} /><span>Discover</span></a>
        <a href="/?view=saved" className="mobile-tab"><Icon name="bookmark" size={18} /><span>Saved</span></a>
      </nav>
    </div>
  );
}
