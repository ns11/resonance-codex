import { createFileRoute } from "@tanstack/react-router";
import { GlossaryLink } from "@/components/glossary";
import { PageHead } from "@/components/shell";
import { useCodex } from "@/lib/codex";

export const Route = createFileRoute("/bestiary")({ component: Bestiary });

function Bestiary() {
  const { pack, integrated } = useCodex();
  const families = pack.families.filter((f) => f.id !== "uncharted" || pack.keywords.some((k) => k.family === "uncharted"));
  return (
    <>
      <PageHead
        kicker="Bestiary"
        title="Keywords"
        lede="Names are glossary links. Hover one for the card. A dotted line with a question mark is still in the fog."
      />
      <div className="space-y-10">
        {families.map((family) => {
          const keys = pack.keywords.filter((k) => k.family === family.id);
          if (!keys.length && family.id === "uncharted") return null;
          return (
            <section key={family.id}>
              <h2 className="font-display text-xl">{family.name}</h2>
              <p className="mt-1 text-ink-2">{family.hint}</p>
              <ul className="mt-3 divide-y divide-rule">
                {keys.map((k) => {
                  const on = integrated(k.id);
                  return (
                    <li key={k.id} className="py-3">
                      <GlossaryLink hit={{ kind: "keyword", id: k.id }}>{k.name}</GlossaryLink>
                      <span className="ml-3 font-mono text-xs tracking-wide text-ink-3 uppercase">
                        {on ? "integrated" : "fog"}
                      </span>
                      <p className="mt-1 text-sm leading-relaxed text-ink-2">{k.teaser}</p>
                    </li>
                  );
                })}
                {!keys.length && <li className="py-3 text-ink-3">Nothing filed here yet.</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
