/** A lore pack is everything the engine reads to build one world.
 *  Shape follows the Resonance Codex mock: look, tomes, families,
 *  keywords, figures, library, sections, and the lamp context. */

export const ACCENTS = ["gilt", "verdigris", "lapis", "rubric", "violet", "copper", "slate"] as const;
export const ORNAMENTS = ["spectrum", "orbits", "braces", "lattice", "wave", "rings"] as const;
export const SECTIONS = ["bestiary", "figures", "library", "literature", "crafted", "tomes"] as const;
export const PLACE_KINDS = ["wing", "room", "hall", "chamber", "altar", "cell"] as const;

export type Accent = (typeof ACCENTS)[number];
export type Ornament = (typeof ORNAMENTS)[number];
export type CodexSection = (typeof SECTIONS)[number];
export type PlaceKind = (typeof PLACE_KINDS)[number];

export type TomeSection = { num: string; title: string; page?: number };
export type Chapter = { num: string; title: string; pages?: string; sections: TomeSection[] };
export type Tome = {
  id: string;
  short: string;
  title: string;
  authors: string;
  publisher?: string;
  pages?: string;
  notes?: string[];
  chapters: Chapter[];
};

export type Family = {
  id: string;
  name: string;
  hint: string;
  kind?: "topic" | "company";
  crew?: string;
};

export type Keyword = {
  id: string;
  name: string;
  teaser: string;
  family: string;
  tome?: string;
  num?: string;
  page?: number;
};

export type Work = { year?: number; title: string; venue?: string; note?: string };
export type Figure = {
  id: string;
  name: string;
  years?: string;
  role?: string;
  place?: string;
  teaser: string;
  bio: string[];
  why?: string;
  works?: Work[];
  related?: string[];
};

export type Place = {
  id: string;
  kind: PlaceKind;
  name: string;
  role?: "open" | "own" | "hidden";
  blurb: string;
  figures?: string[];
  children?: Place[];
};

export type Library = {
  id: string;
  kind: "library";
  name: string;
  blurb: string;
  places: Place[];
};

export type Suggestion = { tome: string; num: string; why: string };

/** The document a lore author hands the engine. */
export type LorePack = {
  id: string;
  name: string;
  short: string;
  subject: string;
  tagline: string;
  look: { accent: Accent; ornament: Ornament };
  builtin?: boolean;
  status?: "draft" | "verified";
  tomes: Tome[];
  families: Family[];
  keywords: Keyword[];
  figures: Figure[];
  library: Library;
  sections: CodexSection[];
  suggested: Suggestion[];
  context: string;
  how: string[];
};

export type FlatPlace = Place & { depth: number; trail: string[] };
