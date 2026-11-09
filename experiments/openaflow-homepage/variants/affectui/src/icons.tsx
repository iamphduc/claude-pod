// 16 px stroked SVG icons in currentColor, drawn like Open AFlow's shared set.
import type { ReactNode } from "react";

const PATHS: Record<string, ReactNode> = {
  download: <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />,
  github: (
    <path d="M6 13.5c-3 .9-3-1.5-4.2-1.8M10 13.5v-2.1a1.8 1.8 0 0 0-.5-1.4c1.7-.2 3.5-.8 3.5-3.7a2.9 2.9 0 0 0-.8-2 2.7 2.7 0 0 0 0-2s-.6-.2-2.1.8a7.2 7.2 0 0 0-3.8 0C4.8 2.1 4.2 2.3 4.2 2.3a2.7 2.7 0 0 0 0 2 2.9 2.9 0 0 0-.8 2c0 2.9 1.8 3.5 3.5 3.7a1.8 1.8 0 0 0-.5 1.4v2.1" />
  ),
  sun: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
    </>
  ),
  moon: <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />,
  monitor: (
    <>
      <rect x="2" y="2.5" width="12" height="8.5" rx="1.5" />
      <path d="M5.5 13.5h5M8 11v2.5" />
    </>
  ),
  copy: (
    <>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 3.5V3A1 1 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6a1 1 0 0 0 1 1h.5" />
    </>
  ),
  check: <path d="M3.5 8.5l3 3 6-7" />,
  replay: (
    <>
      <path d="M2.75 8a5.25 5.25 0 1 0 1.6-3.77" />
      <path d="M2.5 2.5v2.75h2.75" />
    </>
  ),
  file: (
    <>
      <path d="M9 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6Z" />
      <path d="M9 2v4h4" />
    </>
  ),
  write: (
    <>
      <path d="M9 2H4.5A1.5 1.5 0 0 0 3 3.5v9A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5V6Z" />
      <path d="M9 2v4h4M8 8.5v3.5M6.25 10.25h3.5" />
    </>
  ),
  edit: <path d="M10.5 2.5 13.5 5.5 6 13H3v-3Z M9 4l3 3" />,
  terminal: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <path d="M4.5 6 6.5 8 4.5 10M8 10.5h3.5" />
    </>
  ),
  board: (
    <>
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
      <path d="M6 2.5v11M10 2.5v11" />
    </>
  ),
  bell: <path d="M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3ZM6.5 14a1.5 1.5 0 0 0 3 0" />,
  pointer: <path d="M3.5 2.5 12.5 7l-4 1.5-1.5 4Z" />,
  forward: <path d="M2.5 4.5 7 8l-4.5 3.5ZM8 4.5 12.5 8 8 11.5ZM13.5 4v8" />,
  lock: (
    <>
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
