import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { GlossaryLink } from "@/components/glossary";
import { PageHead } from "@/components/shell";
import { useCodex } from "@/lib/codex";

const searchSchema = z.object({
  sec: z.preprocess((value) => (value == null || value === "" ? undefined : String(value)), z.string().optional()),
});

export const Route = createFileRoute("/tome/$id")({
  validateSearch: searchSchema,
  component: TomePage,
});

function TomePage() {
  const { id } = Route.useParams();
  const { sec } = Route.useSearch();
  const { pack } = useCodex();
  const tome = pack.tomes.find((t) => t.id === id);
  useEffect(() => {
    if (!sec) return;
    document.getElementById(`s-${sec}`)?.scrollIntoView({ block: "center" });
  }, [sec, id]);
  if (!tome) return <PageHead kicker="Tomes" title="Not on this shelf" />;
  return (
    <>
      <PageHead kicker={tome.short} title={tome.title} lede={tome.authors} />
      {tome.publisher && <p className="mb-2 font-mono text-sm text-ink-3">{tome.publisher}</p>}
      {tome.notes?.map((n) => (
        <p key={n} className="mb-4 text-ink-2">
          {n}
        </p>
      ))}
      <div className="space-y-6">
        {tome.chapters.map((c) => (
          <section key={c.num}>
            <h2 className="font-display text-lg">
              {c.num}. {c.title}
            </h2>
            <ul className="mt-2 space-y-1">
              {c.sections.map((s) => {
                const keyword = pack.keywords.find((k) => k.tome === tome.id && k.num === s.num);
                const marked = sec === s.num;
                return (
                  <li key={s.num} id={`s-${s.num}`} className={marked ? "bg-gilt-soft px-2 py-1" : "px-2 py-1"}>
                    <span className="font-mono text-sm text-ink-3">{s.num}</span>{" "}
                    {keyword ? (
                      <GlossaryLink hit={{ kind: "keyword", id: keyword.id }}>{s.title}</GlossaryLink>
                    ) : (
                      <span className="fogtxt">????</span>
                    )}
                    {s.page ? <span className="font-mono text-xs text-ink-3"> · p. {s.page}</span> : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
