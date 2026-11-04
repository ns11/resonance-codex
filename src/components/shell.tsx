import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookMarked, Library, Moon, ScrollText, Sun, Swords, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Ornament } from "./ornament";
import { GlossaryHost } from "./glossary";
import { Prose } from "./prose";
import { pathFitsPack } from "@/lib/lore/engine";
import { useCodex } from "@/lib/codex";
import type { LorePack } from "@/lib/lore/types";

const NAV = [
  { to: "/", label: "Overview", icon: BookMarked },
  { to: "/bestiary", label: "Bestiary", icon: Swords },
  { to: "/figures", label: "Figures", icon: Users },
  { to: "/library", label: "Library", icon: Library },
  { to: "/tomes", label: "Tomes", icon: ScrollText },
] as const;

function navOn(path: string, to: string) {
  if (to === "/") return path === "/";
  if (to === "/bestiary") return path === "/bestiary" || path.startsWith("/entry/");
  if (to === "/figures") return path === "/figures" || path.startsWith("/figure/");
  if (to === "/tomes") return path === "/tomes" || path.startsWith("/tome/");
  return path === to || path.startsWith(`${to}/`);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { pack, packs, ready, setLore, integratedCount } = useCodex();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("codex:theme");
    const on = saved === "dark";
    setDark(on);
    document.documentElement.dataset.theme = on ? "dark" : "light";
    document.documentElement.dataset.accent = pack.look.accent;
  }, [pack.look.accent]);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!ready) return;
    if (!pathFitsPack(path, pack)) void navigate({ to: "/" });
  }, [ready, pack, path, navigate]);

  useEffect(() => {
    if (!open) return;
    function onPointer(ev: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(ev.target as Node)) setOpen(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("codex:theme", next ? "dark" : "light");
  }

  function pickLore(next: LorePack) {
    setLore(next.id);
    setOpen(false);
    if (!pathFitsPack(path, next)) void navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-vellum text-ink">
      <header className="sticky top-0 z-20 border-b border-bind-rule bg-bind text-bind-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="flex min-h-11 items-center gap-2 rounded-sm px-2 text-bind-gilt"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="font-display text-sm tracking-wide">{pack.short}</span>
              <span className="text-xs text-bind-ink-2" aria-hidden>
                ▾
              </span>
            </button>
            {open && (
              <div
                role="menu"
                className="absolute left-0 top-full z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] border border-bind-rule bg-bind-2 p-1 shadow-lg"
              >
                {packs.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="menuitem"
                    className="flex w-full min-h-11 flex-col items-start rounded-sm px-3 py-2 text-left hover:bg-bind"
                    onClick={() => pickLore(p)}
                  >
                    <span className="font-display text-sm text-bind-gilt">{p.name}</span>
                    <span className="text-xs text-bind-ink-2">
                      {p.subject} · {p.status === "draft" ? "draft" : "verified"}
                      {p.id === pack.id ? " · open" : ""}
                    </span>
                  </button>
                ))}
                <Link
                  to="/lores"
                  role="menuitem"
                  className="block min-h-11 px-3 py-2 text-sm text-bind-ink-2 hover:text-bind-ink"
                  onClick={() => setOpen(false)}
                >
                  All lores
                </Link>
              </div>
            )}
          </div>
          <p className="hidden min-w-0 flex-1 truncate font-display text-xs tracking-widest text-bind-ink-2 uppercase sm:block">
            {pack.name}
          </p>
          <p className="ml-auto font-mono text-xs text-bind-ink-2">
            {integratedCount}/{pack.keywords.length} integrated
          </p>
          <button
            type="button"
            className="flex size-11 items-center justify-center text-bind-gilt"
            onClick={toggleTheme}
            aria-label={dark ? "Day vellum" : "Night study"}
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2" aria-label="Codex">
          {NAV.map((item) => {
            const on = navOn(path, item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-sm px-3 text-sm ${
                  on ? "bg-bind-3 text-bind-gilt" : "text-bind-ink-2 hover:text-bind-ink"
                }`}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <GlossaryHost />
    </div>
  );
}

export function PageHead({
  kicker,
  title,
  lede,
  skipId,
}: {
  kicker: string;
  title: string;
  lede?: string;
  skipId?: string;
}) {
  const { pack } = useCodex();
  return (
    <header className="mb-8 border-b border-rule pb-6">
      <p className="font-display text-xs tracking-[0.18em] text-accent uppercase">{kicker}</p>
      <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{title}</h1>
      <Ornament kind={pack.look.ornament} />
      {lede && (
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">
          <Prose text={lede} skipId={skipId} />
        </p>
      )}
    </header>
  );
}