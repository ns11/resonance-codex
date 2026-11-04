import { Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useCodex } from "@/lib/codex";
import { flattenPlaces, shownYears, type LinkHit } from "@/lib/lore/engine";
import type { LorePack } from "@/lib/lore/types";
import { Prose } from "./prose";

const MAX_DEPTH = 3;

type Tip = {
  hit: LinkHit;
  sec?: string;
  link: HTMLAnchorElement;
  rect: DOMRect;
  depth: number;
};

function parseTip(link: HTMLAnchorElement): { hit: LinkHit; sec?: string } | null {
  const raw = link.dataset.tip || "";
  const cut = raw.indexOf(":");
  if (cut < 1) return null;
  const kind = raw.slice(0, cut);
  const id = raw.slice(cut + 1);
  if (kind !== "tome" && kind !== "keyword" && kind !== "figure" && kind !== "place") return null;
  if (!id) return null;
  return { hit: { kind, id }, sec: link.dataset.sec || undefined };
}

export function GlossaryLink({
  hit,
  sec,
  children,
  className,
}: {
  hit: LinkHit;
  sec?: string;
  children: ReactNode;
  className?: string;
}) {
  const { integrated } = useCodex();
  const known = hit.kind !== "keyword" || integrated(hit.id);
  const cls = ["kw", known ? "kw-known" : "kw-fog", hit.kind === "keyword" ? "" : `kw-${hit.kind}`, className]
    .filter(Boolean)
    .join(" ");
  const tip = `${hit.kind}:${hit.id}`;
  if (hit.kind === "tome") {
    return (
      <Link to="/tome/$id" params={{ id: hit.id }} search={sec ? { sec } : {}} data-tip={tip} data-sec={sec} className={cls}>
        {children}
      </Link>
    );
  }
  if (hit.kind === "keyword") {
    return (
      <Link to="/entry/$id" params={{ id: hit.id }} data-tip={tip} className={cls}>
        {children}
      </Link>
    );
  }
  if (hit.kind === "figure") {
    return (
      <Link to="/figure/$id" params={{ id: hit.id }} data-tip={tip} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/library" hash={`place-${hit.id}`} data-tip={tip} className={cls}>
      {children}
    </Link>
  );
}

function placeTip(anchor: DOMRect, height: number, depth: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(360, vw - 32);
  let left = Math.min(Math.max(16, anchor.left - 10), vw - 16 - width);
  let top = anchor.bottom + 8;
  if (depth > 0) {
    const parent = document.querySelector<HTMLElement>(`.kw-tip[data-depth="${depth - 1}"]`);
    const pr = parent?.getBoundingClientRect();
    if (pr) {
      if (pr.right + 10 + width <= vw - 8) left = pr.right + 10;
      else if (pr.left - 10 - width >= 8) left = pr.left - 10 - width;
    }
  }
  if (top + height > vh - 8) {
    const above = anchor.top - 8 - height;
    top = above >= 8 ? above : Math.max(8, vh - 8 - height);
  }
  return { top, left, width };
}

function TipCard({ tip, pack, known, coarse }: { tip: Tip; pack: LorePack; known: boolean; coarse: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const hit = tip.hit;
  const keyword = hit.kind === "keyword" ? pack.keywords.find((k) => k.id === hit.id) : undefined;
  const book = hit.kind === "tome" ? pack.tomes.find((t) => t.id === hit.id) : undefined;
  const cited = keyword?.tome ? pack.tomes.find((t) => t.id === keyword.tome) : undefined;
  const figure = hit.kind === "figure" ? pack.figures.find((f) => f.id === hit.id) : undefined;
  const spot = hit.kind === "place" ? flattenPlaces(pack).find((p) => p.id === hit.id) : undefined;

  let kind = "Entry";
  let name = hit.id;
  let level = "";
  let body = "";
  let fog = false;
  let found = "";
  if (keyword) {
    kind = known ? "Concept" : "Concept · discovered";
    name = keyword.name;
    level = known ? "Integrated" : "Fog";
    body = keyword.teaser;
    fog = !known;
    if (cited && keyword.num) found = `${cited.short} §${keyword.num}${keyword.page ? `, p. ${keyword.page}` : ""}`;
  } else if (hit.kind === "tome" && book) {
    kind = "Book";
    name = book.title;
    level = book.authors;
    body = book.notes?.[0] || `${book.chapters.length} chapters on this shelf.`;
  } else if (figure) {
    kind = figure.role || "Figure";
    name = figure.name;
    level = shownYears(figure.years) || "A name on this shelf";
    body = figure.teaser;
  } else if (spot) {
    kind = spot.kind;
    name = spot.name;
    level = "Place";
    body = spot.blurb;
  }

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setBox(placeTip(tip.rect, el.offsetHeight, tip.depth));
  }, [tip, name, body]);

  const open =
    hit.kind === "tome" ? "Open the book" : hit.kind === "figure" ? "Open the figure" : hit.kind === "place" ? "Enter" : "Open entry";

  return (
    <div
      ref={ref}
      className={`kw-tip${box ? " show" : ""}`}
      role="tooltip"
      data-depth={tip.depth}
      style={{
        top: box?.top ?? 0,
        left: box?.left ?? 0,
        width: box?.width ?? Math.min(360, typeof window !== "undefined" ? window.innerWidth - 32 : 320),
        visibility: box ? "visible" : "hidden",
      }}
    >
      <div className="tip-head">
        <div className="tip-kind">{kind}</div>
        <div className="tip-name">{name}</div>
        {level && (
          <div className="tip-level">
            <span>{level}</span>
          </div>
        )}
      </div>
      <div className="tip-body">
        <p>
          <Prose text={body} skipId={hit.id} />
        </p>
        {fog && (
          <p className="tip-fog">
            <span className="fogtxt">????</span> Not integrated yet.
          </p>
        )}
        {found && <p className="tip-found">Seen in {found}.</p>}
      </div>
      <div className="tip-foot">
        {hit.kind === "tome" ? (
          <Link to="/tome/$id" params={{ id: hit.id }} search={tip.sec ? { sec: tip.sec } : {}} className="tip-open">
            {open}
          </Link>
        ) : hit.kind === "keyword" ? (
          <Link to="/entry/$id" params={{ id: hit.id }} className="tip-open">
            {open}
          </Link>
        ) : hit.kind === "figure" ? (
          <Link to="/figure/$id" params={{ id: hit.id }} className="tip-open">
            {open}
          </Link>
        ) : (
          <Link to="/library" hash={`place-${hit.id}`} className="tip-open">
            {open}
          </Link>
        )}
        <span className="tip-hint">{coarse ? "Tap the word again to open" : "Click the word to open"}</span>
      </div>
    </div>
  );
}

export function GlossaryHost() {
  const { pack, integrated } = useCodex();
  const [stack, setStack] = useState<Tip[]>([]);
  const [coarse, setCoarse] = useState(false);
  const [mounted, setMounted] = useState(false);
  const stackRef = useRef(stack);
  stackRef.current = stack;

  useEffect(() => {
    setMounted(true);
    const pointer = { current: "mouse" as "mouse" | "touch" };
    let showTimer = 0;
    let trimTimer = 0;

    const linkOf = (node: EventTarget | null) =>
      node instanceof Element ? (node.closest("a[data-tip]") as HTMLAnchorElement | null) : null;
    const tipOf = (node: EventTarget | null) => (node instanceof Element ? node.closest(".kw-tip") : null);

    function closeFrom(depth: number) {
      setStack((prev) => {
        for (const tip of prev.slice(depth)) tip.link.classList.remove("kw-active");
        return prev.slice(0, depth);
      });
    }

    function open(link: HTMLAnchorElement, depth: number) {
      const parsed = parseTip(link);
      if (!parsed || depth >= MAX_DEPTH) return;
      link.classList.add("kw-active");
      const next: Tip = { ...parsed, link, rect: link.getBoundingClientRect(), depth };
      setStack((prev) => {
        for (const tip of prev.slice(depth)) tip.link.classList.remove("kw-active");
        link.classList.add("kw-active");
        return prev.slice(0, depth).concat(next);
      });
    }

    function scheduleTrim(depth: number) {
      window.clearTimeout(trimTimer);
      if (stackRef.current.length > depth) trimTimer = window.setTimeout(() => closeFrom(depth), 280);
    }

    function onOver(ev: MouseEvent) {
      if (pointer.current !== "mouse") return;
      window.clearTimeout(trimTimer);
      const link = linkOf(ev.target);
      const tip = tipOf(ev.target);
      if (link && parseTip(link)) {
        const depth = tip ? Number((tip as HTMLElement).dataset.depth) + 1 : 0;
        window.clearTimeout(showTimer);
        if (stackRef.current[depth]?.link === link) {
          scheduleTrim(depth + 1);
          return;
        }
        showTimer = window.setTimeout(() => open(link, depth), depth === 0 ? 140 : 220);
        return;
      }
      window.clearTimeout(showTimer);
      scheduleTrim(tip ? Number((tip as HTMLElement).dataset.depth) + 1 : 0);
    }

    function onClick(ev: MouseEvent) {
      if (ev.target instanceof Element && ev.target.closest("a.tip-open")) {
        closeFrom(0);
        return;
      }
      const link = linkOf(ev.target);
      if (!link || !parseTip(link)) return;
      const tip = tipOf(link);
      const depth = tip ? Number((tip as HTMLElement).dataset.depth) + 1 : 0;
      if (pointer.current === "touch") {
        if (stackRef.current[depth]?.link === link) {
          closeFrom(0);
          return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        open(link, depth);
        return;
      }
      closeFrom(0);
    }

    function onPointerDown(ev: PointerEvent) {
      pointer.current = ev.pointerType === "touch" || ev.pointerType === "pen" ? "touch" : "mouse";
      setCoarse(pointer.current === "touch");
      if (!tipOf(ev.target) && !linkOf(ev.target)) closeFrom(0);
    }

    function onFocus(ev: FocusEvent) {
      const link = linkOf(ev.target);
      if (!link || !link.matches(":focus-visible")) return;
      const tip = tipOf(link);
      open(link, tip ? Number((tip as HTMLElement).dataset.depth) + 1 : 0);
    }

    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") closeFrom(0);
    }

    function onLeave() {
      if (pointer.current !== "mouse") return;
      window.clearTimeout(showTimer);
      scheduleTrim(0);
    }

    function onScroll() {
      if (stackRef.current.length) closeFrom(0);
    }

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(trimTimer);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (!mounted) return null;
  return createPortal(
    <>
      {stack.map((tip) => (
        <TipCard
          key={`${tip.depth}:${tip.hit.kind}:${tip.hit.id}`}
          tip={tip}
          pack={pack}
          known={tip.hit.kind !== "keyword" || integrated(tip.hit.id)}
          coarse={coarse}
        />
      ))}
    </>,
    document.body,
  );
}
