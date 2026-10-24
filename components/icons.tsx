import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "play" | "search" | "bell" | "chevron" | "home" | "film" | "tv"
  | "spark" | "bookmark" | "clock" | "grid" | "fire" | "star" | "menu"
  | "arrow" | "close" | "download" | "info" | "check" | "filter" | "refresh";

export function Icon({ name, size = 18, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...props };
  const paths: Record<IconName, ReactNode> = {
    play: <path d="m8 5 12 7-12 7V5Z" fill="currentColor" stroke="none" />,
    search: <><circle cx="10.8" cy="10.8" r="6.7" /><path d="m16 16 4.4 4.4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
    film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4m-4 6h4m10-6h4m-4 6h4" /></>,
    tv: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="m8 3 4 3 4-3" /></>,
    spark: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
    bookmark: <><path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-4-6 4V4.5Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    grid: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></>,
    fire: <path d="M12 22c4.2 0 7-2.9 7-7.1 0-3.7-2.4-6.2-4.2-8.1-.1 2.4-1.4 3.6-2.5 4.3C12.3 7.1 10.8 4.7 8.6 3 9.1 7.7 5 9.7 5 15c0 4.3 2.8 7 7 7Z" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v3h16v-3" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    filter: <><path d="M4 7h16M7 12h10m-7 5h4" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 1-2-5l3 5" /></>,
  };
  return <svg aria-hidden="true" {...common}>{paths[name]}</svg>;
}
