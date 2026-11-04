import { createFileRoute } from "@tanstack/react-router";
import { GlossaryLink } from "@/components/glossary";
import { PageHead } from "@/components/shell";
import { Prose } from "@/components/prose";
import { useCodex } from "@/lib/codex";
import { shownYears } from "@/lib/lore/engine";

export const Route = createFileRoute("/figure/$id")({ component: FigurePage });

function FigurePage() {
  const { id } = Route.useParams();
  const { pack } = useCodex();
  const figure = pack.figures.find((f) => f.id === id);
  if (!figure) return <PageHead kicker="Figures" title="Not in this lore" />;
  return (
    <>
      <PageHead kicker={figure.role ?? "Figure"} title={figure.name} lede={figure.teaser} skipId={figure.id} />
      {shownYears(figure.years) && <p className="mb-4 font-mono text-sm text-ink-3">{shownYears(figure.years)}</p>}
      {figure.bio.map((p) => (
        <p key={p} className="mb-4 max-w-2xl leading-relaxed">
          <Prose text={p} skipId={figure.id} />
        </p>
      ))}
      {figure.why && (
        <p className="mb-6 max-w-2xl border-l-4 border-accent pl-4 text-ink-2">
          <Prose text={figure.why} skipId={figure.id} />
        </p>
      )}
      {!!figure.works?.length && (
        <section className="mb-6">
          <h2 className="font-display text-lg">Works</h2>
          <ul className="mt-2 space-y-2">
            {figure.works.map((w) => (
              <li key={w.title} className="text-ink-2">
                {w.year ? <span className="font-mono text-sm text-ink-3">{w.year}. </span> : null}
                <Prose text={w.title} skipId={figure.id} />
                {w.venue ? <span className="text-ink-3"> — {w.venue}</span> : null}
                {w.note ? <span className="text-ink-3"> ({w.note})</span> : null}
              </li>
            ))}
          </ul>
        </section>
      )}
      {!!figure.related?.length && (
        <p className="text-ink-2">
          Related:{" "}
          {figure.related.map((rid, i) => {
            const other = pack.figures.find((f) => f.id === rid);
            return (
              <span key={rid}>
                {i > 0 && ", "}
                {other ? (
                  <GlossaryLink hit={{ kind: "figure", id: rid }}>{other.name}</GlossaryLink>
                ) : (
                  rid
                )}
              </span>
            );
          })}
        </p>
      )}
    </>
  );
}
