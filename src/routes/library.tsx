import { createFileRoute } from "@tanstack/react-router";
import { GlossaryLink } from "@/components/glossary";
import { PageHead } from "@/components/shell";
import { Prose } from "@/components/prose";
import { useCodex, usePlaces } from "@/lib/codex";

export const Route = createFileRoute("/library")({ component: LibraryPage });

const ROLE: Record<string, string> = { open: "open desk", own: "yours", hidden: "keeper only" };

function LibraryPage() {
  const { pack } = useCodex();
  const places = usePlaces();
  return (
    <>
      <PageHead kicker="Library" title={pack.library.name} lede={pack.library.blurb} />
      <ul className="space-y-3">
        {places.map((p) => (
          <li
            key={p.id}
            id={`place-${p.id}`}
            className="border border-rule bg-raise p-4"
            style={{ marginLeft: `${p.depth * 1.25}rem` }}
          >
            <p className="font-mono text-xs tracking-widest text-ink-3 uppercase">
              {p.kind}
              {p.role ? ` · ${ROLE[p.role] ?? p.role}` : ""}
            </p>
            <h2 className="font-display text-lg">
              <GlossaryLink hit={{ kind: "place", id: p.id }}>{p.name}</GlossaryLink>
            </h2>
            <p className="mt-1 text-ink-2">
              <Prose text={p.blurb} />
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
