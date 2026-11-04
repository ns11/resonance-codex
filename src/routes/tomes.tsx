import { createFileRoute } from "@tanstack/react-router";
import { GlossaryLink } from "@/components/glossary";
import { PageHead } from "@/components/shell";
import { useCodex } from "@/lib/codex";

export const Route = createFileRoute("/tomes")({ component: Tomes });

function Tomes() {
  const { pack } = useCodex();
  return (
    <>
      <PageHead kicker="Tomes" title="The shelf" lede="A short shelf. The title is the link into the book. Hover it for the card." />
      <ul className="divide-y divide-rule">
        {pack.tomes.map((t) => (
          <li key={t.id} className="py-4">
            <span className="font-mono text-xs text-ink-3">{t.short}</span>
            <div>
              <GlossaryLink hit={{ kind: "tome", id: t.id }}>{t.title}</GlossaryLink>
            </div>
            <p className="mt-1 text-sm text-ink-2">{t.authors}</p>
            <p className="mt-1 font-mono text-xs text-ink-3">
              {t.chapters.length} chapter{t.chapters.length === 1 ? "" : "s"}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
