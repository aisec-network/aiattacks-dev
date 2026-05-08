export interface IdentityFont {
  id: string;
  display: string;
  body: string;
  mono: string;
  google_fonts_url: string;
  stack_display: string;
  stack_body: string;
  stack_mono: string;
}

export interface IdentityPalette {
  id: string;
  hue: number;
  neutral_family: string;
  accent: string;
  accent_dark: string;
  surface: string;
  surface_alt: string;
  fg: string;
  fg_muted: string;
  border: string;
  surface_dark: string;
  surface_alt_dark: string;
  fg_dark: string;
  fg_muted_dark: string;
  border_dark: string;
}

export interface IdentityLayout {
  id: "magazine" | "dashboard" | "feed" | "directory" | "longform" | "kiosk";
  component: string;
  component_path: string;
  density: "loose" | "normal" | "dense";
  brief: string;
}

export interface IdentityVoice {
  id: string;
  label_latest: string;
  label_recent: string;
  label_featured: string;
  label_more: string;
  nav_posts: string;
  nav_about: string;
  cta_subscribe: string;
  cta_subscribe_desc: string;
  cta_button: string;
  site_motto: string;
}

export interface Identity {
  font: IdentityFont;
  palette: IdentityPalette;
  layout: IdentityLayout;
  voice: IdentityVoice;
}

export const identity: Identity = {
  "font": {
    "id": "f28_mono_spacemono_jakarta",
    "display": "Space Mono",
    "body": "Plus Jakarta Sans",
    "mono": "Space Mono",
    "google_fonts_url": "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    "stack_display": "\"Space Mono\", ui-monospace, monospace",
    "stack_body": "\"Plus Jakarta Sans\", \"Helvetica Neue\", system-ui, sans-serif",
    "stack_mono": "\"Space Mono\", ui-monospace, monospace"
  },
  "palette": {
    "id": "p26_h124_cool",
    "hue": 124,
    "neutral_family": "cool",
    "accent": "41 174 50",
    "accent_dark": "71 225 81",
    "surface": "254 254 255",
    "surface_alt": "246 248 252",
    "fg": "12 18 32",
    "fg_muted": "70 80 108",
    "border": "220 226 238",
    "surface_dark": "12 16 28",
    "surface_alt_dark": "22 28 46",
    "fg_dark": "240 244 252",
    "fg_muted_dark": "156 166 196",
    "border_dark": "50 60 84"
  },
  "layout": {
    "id": "feed",
    "component": "HomeNewspaper",
    "component_path": "@components/clusters/HomeNewspaper.astro",
    "density": "dense",
    "brief": "Newspaper-style feed: dense single-column with sidebar digest."
  },
  "voice": {
    "id": "v01_editorial",
    "label_latest": "Latest",
    "label_recent": "Recent",
    "label_featured": "Featured",
    "label_more": "Read more",
    "nav_posts": "Posts",
    "nav_about": "About",
    "cta_subscribe": "Subscribe",
    "cta_subscribe_desc": "Get our latest writing in your inbox.",
    "cta_button": "Subscribe",
    "site_motto": "Original writing, sourced reporting."
  }
} as const;
