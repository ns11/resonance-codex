import { createFileRoute } from "@tanstack/react-router";
import { GlossaryLink } from "@/components/glossary";
import { PageHead } from "@/components/shell";
import { useCodex } from "@/lib/codex";
import { shownYears } from "@/lib/lore/engine";

export const Route = createFileRoute("/figures")({ component: Figures });

function Figures() {
  const { pack } = useCodex();
  return (
    <>
      <PageHead
        kicker="Figures"
        title="Namesakes"
        lede="Their names are underlined wherever they appear. Hover one for the short life."
      />
      <ul className="divide-y divide-rule">
        {pack.figures.map((f) => (
          <li key={f.id} className="py-4">
            <GlossaryLink hit={{ kind: "figure", id: f.id }}>{f.name}</GlossaryLink>
            {shownYears(f.years) && <span className="ml-2 font-mono text-xs text-ink-3">{shownYears(f.years)}</span>}
            {f.role && <span className="mt-1 block text-sm text-ink-3">{f.role}</span>}
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{f.teaser}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
