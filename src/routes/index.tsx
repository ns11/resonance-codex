import { createFileRoute } from "@tanstack/react-router";
import { GlossaryLink } from "@/components/glossary";
import { PageHead } from "@/components/shell";
import { Prose } from "@/components/prose";
import { useCodex } from "@/lib/codex";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { pack, integratedCount } = useCodex();
  return (
    <>
      <PageHead kicker={pack.subject} title={pack.name} lede={pack.tagline} />
      <dl className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [String(pack.keywords.length), "keywords"],
          [String(integratedCount), "integrated"],
          [String(pack.figures.length), "figures"],
          [String(pack.tomes.length), "tomes"],
        ].map(([n, label]) => (
          <div key={label} className="border border-rule bg-raise px-4 py-3">
            <dt className="font-display text-xs tracking-widest text-ink-3 uppercase">{label}</dt>
            <dd className="font-mono text-2xl text-ink">{n}</dd>
          </div>
        ))}
      </dl>
      <section className="mb-8 border border-rule bg-surface p-5">
        <h2 className="font-display text-lg">How this lore is read</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink-2">
          {pack.how.map((line) => (
            <li key={line}>
              <Prose text={line} />
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className="font-display text-lg">Suggested next</h2>
        <ul className="mt-3 space-y-3">
          {pack.suggested.map((s) => {
            const tome = pack.tomes.find((t) => t.id === s.tome);
            return (
              <li key={s.tome + s.num} className="border border-rule bg-raise p-4">
                <GlossaryLink hit={{ kind: "tome", id: s.tome }} sec={s.num} className="font-display">
                  {tome?.title ?? s.tome} §{s.num}
                </GlossaryLink>
                <p className="mt-1 text-ink-2">
                  <Prose text={s.why} />
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
