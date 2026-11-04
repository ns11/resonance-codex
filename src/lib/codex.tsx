import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { acceptPack, flattenPlaces } from "./lore/engine";
import { DEFAULT_LORE, PACKS } from "./lore/packs";
import type { LorePack } from "./lore/types";

const LORE_KEY = "codex:lore";
const PROG_KEY = "codex:progress";

type Progress = Record<string, string[]>;

type CodexApi = {
  ready: boolean;
  packs: LorePack[];
  pack: LorePack;
  setLore: (id: string) => void;
  integrated: (keywordId: string) => boolean;
  toggleIntegrated: (keywordId: string) => void;
  integratedCount: number;
};

const CodexContext = createContext<CodexApi | null>(null);

const loaded = PACKS.map((p) => acceptPack(p)).filter((p): p is LorePack => !!p);

function readProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROG_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Progress = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!Array.isArray(value)) continue;
      out[key] = value.filter((item): item is string => typeof item === "string");
    }
    return out;
  } catch {
    return {};
  }
}

export function CodexProvider({ children }: { children: ReactNode }) {
  const [loreId, setLoreId] = useState(DEFAULT_LORE);
  const [progress, setProgress] = useState<Progress>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LORE_KEY);
      if (saved && loaded.some((p) => p.id === saved)) setLoreId(saved);
    } catch {
      /* storage may be blocked */
    }
    setProgress(readProgress());
    try {
      const raw = localStorage.getItem(PROG_KEY);
      const clean = JSON.stringify(readProgress());
      if (raw && raw !== clean) localStorage.setItem(PROG_KEY, clean);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const pack = loaded.find((p) => p.id === loreId) ?? loaded[0];

  const api = useMemo<CodexApi>(() => {
    const ids = Array.isArray(progress[pack.id]) ? progress[pack.id] : [];
    return {
      ready,
      packs: loaded,
      pack,
      setLore: (id: string) => {
        if (!loaded.some((p) => p.id === id)) return;
        setLoreId(id);
        try {
          localStorage.setItem(LORE_KEY, id);
        } catch {
          /* ignore */
        }
      },
      integrated: (keywordId: string) => ids.includes(keywordId),
      toggleIntegrated: (keywordId: string) => {
        setProgress((prev) => {
          const cur = Array.isArray(prev[pack.id]) ? prev[pack.id] : [];
          const next = cur.includes(keywordId) ? cur.filter((x) => x !== keywordId) : cur.concat(keywordId);
          const all = { ...prev, [pack.id]: next };
          try {
            localStorage.setItem(PROG_KEY, JSON.stringify(all));
          } catch {
            /* ignore */
          }
          return all;
        });
      },
      integratedCount: ids.length,
    };
  }, [pack, progress, ready]);

  return <CodexContext.Provider value={api}>{children}</CodexContext.Provider>;
}

export function useCodex() {
  const ctx = useContext(CodexContext);
  if (!ctx) throw new Error("useCodex outside provider");
  return ctx;
}

export function usePlaces() {
  const { pack } = useCodex();
  return flattenPlaces(pack);
}
