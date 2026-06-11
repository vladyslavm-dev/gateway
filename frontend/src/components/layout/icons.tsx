import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <path d="M4 6.5h16v11H4z" />
      <path d="m5 7 7 6 7-6" />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.94 8.5H3.56V20h3.38zm.22-4.34a1.96 1.96 0 1 0-3.92 0 1.96 1.96 0 0 0 3.92 0M20.43 20v-6.2c0-3.32-1.77-4.86-4.13-4.86-1.9 0-2.75 1.04-3.23 1.77v-1.52H9.69c.05 1 .07 10.8 0 10.8h3.38v-6.03c0-.32.02-.64.12-.86.26-.64.86-1.3 1.86-1.3 1.31 0 1.84.99 1.84 2.44V20z" />
    </svg>
  );
}

export function GitHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5C5.65.5.5 5.75.5 12.23c0 5.18 3.3 9.57 7.88 11.12.58.1.78-.25.78-.57v-2.02c-3.2.71-3.88-1.38-3.88-1.38-.52-1.37-1.28-1.74-1.28-1.74-1.05-.74.08-.72.08-.72 1.16.08 1.77 1.22 1.77 1.22 1.04 1.82 2.72 1.3 3.38.99.1-.77.4-1.3.72-1.6-2.55-.3-5.23-1.31-5.23-5.83 0-1.29.45-2.35 1.18-3.17-.12-.3-.51-1.53.11-3.18 0 0 .96-.31 3.14 1.21a10.63 10.63 0 0 1 5.72 0c2.17-1.52 3.12-1.21 3.12-1.21.63 1.65.24 2.88.12 3.18.73.82 1.18 1.88 1.18 3.17 0 4.53-2.69 5.52-5.26 5.82.42.37.78 1.08.78 2.18v3.23c0 .32.2.68.79.57A11.75 11.75 0 0 0 23.5 12.23C23.5 5.75 18.35.5 12 .5" />
    </svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.5 7.1a3 3 0 0 0-2.12-2.12C19.48 4.5 12 4.5 12 4.5s-7.48 0-9.38.48A3 3 0 0 0 .5 7.1 31.3 31.3 0 0 0 0 12.1a31.3 31.3 0 0 0 .5 5 3 3 0 0 0 2.12 2.12c1.9.48 9.38.48 9.38.48s7.48 0 9.38-.48a3 3 0 0 0 2.12-2.12 31.3 31.3 0 0 0 .5-5 31.3 31.3 0 0 0-.5-5M9.6 15.7V8.5l6.24 3.6z" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 14 14" fill="none" {...props}>
      <path
        d="M8.5 3L4.5 7L8.5 11"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
