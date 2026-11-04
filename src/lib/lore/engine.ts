import {
  ACCENTS,
  ORNAMENTS,
  PLACE_KINDS,
  SECTIONS,
  type CodexSection,
  type Family,
  type Figure,
  type FlatPlace,
  type Keyword,
  type LorePack,
  type Place,
  type PlaceKind,
  type Tome,
} from "./types";

const idOk = (s: string) => /^[a-z0-9-]+$/.test(s) && s.length > 0 && s.length <= 40;

function familyOf(pack: LorePack): Record<string, string> {
  const map: Record<string, string> = {};
  for (const k of pack.keywords) map[k.id] = k.family;
  return map;
}

/** Accept a pack only if it has the fields the mock engine requires. */
export function acceptPack(raw: LorePack): LorePack | null {
  if (!raw || !idOk(raw.id)) return null;
  const families: Family[] = raw.families.filter((f) => f && idOk(f.id) && f.name);
  if (!families.some((f) => f.id === "uncharted")) {
    families.push({ id: "uncharted", name: "Uncharted", hint: "Keywords not placed in a family yet." });
  }
  const famIds = new Set(families.map((f) => f.id));
  const keywords: Keyword[] = raw.keywords
    .filter((k) => k && idOk(k.id) && k.name)
    .map((k) => ({ ...k, family: famIds.has(k.family) ? k.family : "uncharted" }));
  const look = {
    accent: ACCENTS.includes(raw.look?.accent) ? raw.look.accent : "gilt",
    ornament: ORNAMENTS.includes(raw.look?.ornament) ? raw.look.ornament : "spectrum",
  } as LorePack["look"];
  const sections = (raw.sections || []).filter((s): s is CodexSection =>
    (SECTIONS as readonly string[]).includes(s),
  );
  return {
    ...raw,
    look,
    families,
    keywords,
    figures: (raw.figures || []).filter((f) => f && idOk(f.id) && f.name),
    tomes: raw.tomes || [],
    sections: sections.length ? sections : ["bestiary", "figures", "library", "tomes"],
    suggested: raw.suggested || [],
    how: raw.how || [],
    context: raw.context || "",
    library: raw.library,
    status: raw.status === "verified" ? "verified" : "draft",
  };
}

export function flattenPlaces(pack: LorePack): FlatPlace[] {
  const out: FlatPlace[] = [];
  const walk = (p: Place, trail: string[]) => {
    out.push({ ...p, depth: trail.length, trail: trail.concat(p.id) });
    for (const c of p.children || []) walk(c, trail.concat(p.id));
  };
  for (const p of pack.library?.places || []) walk(p, []);
  return out;
}

export function placeKindOk(k: string): k is PlaceKind {
  return (PLACE_KINDS as readonly string[]).includes(k);
}

export type CodexIndex = {
  pack: LorePack;
  familyOf: Record<string, string>;
  keywords: Keyword[];
  figures: Figure[];
  places: FlatPlace[];
  tomes: Tome[];
};

export function indexPack(raw: LorePack): CodexIndex | null {
  const pack = acceptPack(raw);
  if (!pack) return null;
  return {
    pack,
    familyOf: familyOf(pack),
    keywords: pack.keywords,
    figures: pack.figures,
    places: flattenPlaces(pack),
    tomes: pack.tomes,
  };
}

export function pathFitsPack(path: string, pack: LorePack): boolean {
  const entry = /^\/entry\/([^/]+)/.exec(path);
  if (entry) return pack.keywords.some((k) => k.id === decodeURIComponent(entry[1]));
  const figure = /^\/figure\/([^/]+)/.exec(path);
  if (figure) return pack.figures.some((f) => f.id === decodeURIComponent(figure[1]));
  const tome = /^\/tome\/([^/]+)/.exec(path);
  if (tome) return pack.tomes.some((t) => t.id === decodeURIComponent(tome[1]));
  return true;
}

export function tomeSection(pack: LorePack, tomeId: string, num: string) {
  const tome = pack.tomes.find((t) => t.id === tomeId);
  if (!tome) return null;
  for (const c of tome.chapters) {
    const hit = c.sections.find((s) => s.num === num);
    if (hit) return { tome, chapter: c, section: hit };
  }
  const chapter = tome.chapters.find((c) => c.num === num);
  return chapter ? { tome, chapter, section: null } : tome ? { tome, chapter: null, section: null } : null;
}

export type LinkHit =
  | { kind: "tome"; id: string }
  | { kind: "keyword"; id: string }
  | { kind: "figure"; id: string }
  | { kind: "place"; id: string };

export type LinkPart = { text: string; hit?: LinkHit };

const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A stored em dash is not a lifespan. */
export function shownYears(years?: string) {
  const text = (years || "").trim();
  return text && !/^[—–-]+$/.test(text) ? text : "";
}

function pluralOf(name: string) {
  if (!/^[A-Za-z]+$/.test(name)) return "";
  if (/(?:s|x|z|ch|sh)$/i.test(name)) return `${name}es`;
  if (/[^aeiou]y$/i.test(name)) return `${name.slice(0, -1)}ies`;
  return `${name}s`;
}

/** Underline names the pack already knows. Longer names win. Every mention links,
 *  including a plural and a name with the middle initial left out. */
export function linkParts(text: string, pack: LorePack, skipId?: string): LinkPart[] {
  const names: { name: string; hit: LinkHit }[] = [];
  const seen = new Set<string>();
  const add = (name: string | undefined, hit: LinkHit) => {
    const trimmed = (name || "").trim();
    const key = trimmed.toLowerCase();
    if (trimmed.length < 3 || seen.has(key) || hit.id === skipId) return;
    seen.add(key);
    names.push({ name: trimmed, hit });
  };
  const addAll = (name: string | undefined, hit: LinkHit) => {
    add(name, hit);
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    const noMiddle = trimmed.replace(/\s+[A-Z]\.\s+/g, " ").replace(/\s+/g, " ").trim();
    if (noMiddle !== trimmed) add(noMiddle, hit);
    add(pluralOf(trimmed), hit);
  };
  for (const t of pack.tomes) {
    addAll(t.title, { kind: "tome", id: t.id });
    if ((t.short || "").length >= 6) add(t.short, { kind: "tome", id: t.id });
  }
  for (const k of pack.keywords) addAll(k.name, { kind: "keyword", id: k.id });
  for (const f of pack.figures) addAll(f.name, { kind: "figure", id: f.id });
  for (const p of flattenPlaces(pack)) addAll(p.name, { kind: "place", id: p.id });
  if (!text || !names.length) return [{ text }];
  names.sort((a, b) => b.name.length - a.name.length);
  const map = new Map(names.map((n) => [n.name.toLowerCase(), n.hit]));
  const re = new RegExp(
    `(^|[^\\p{L}\\p{N}_])(${names.map((n) => escRe(n.name)).join("|")})(?![\\p{L}\\p{N}_])`,
    "giu",
  );
  const parts: LinkPart[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const word = m[2];
    if (m.index === undefined || word === undefined) continue;
    const start = m.index + (m[1]?.length ?? 0);
    const hit = map.get(word.toLowerCase());
    if (!hit) continue;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: word, hit });
    last = start + word.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts.length ? parts : [{ text }];
}
