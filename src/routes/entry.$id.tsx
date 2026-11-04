import { createFileRoute } from "@tanstack/react-router";
import { GlossaryLink } from "@/components/glossary";
import { PageHead } from "@/components/shell";
import { useCodex } from "@/lib/codex";

export const Route = createFileRoute("/entry/$id")({ component: EntryPage });

function EntryPage() {
  const { id } = Route.useParams();
  const { pack, integrated, toggleIntegrated } = useCodex();
  const keyword = pack.keywords.find((k) => k.id === id);
  if (!keyword) {
    return (
      <PageHead
        kicker="Bestiary"
        title="Not in this lore"
        lede="That keyword belongs to another pack, or it has not been drafted yet."
      />
    );
  }
  const family = pack.families.find((f) => f.id === keyword.family);
  const tome = keyword.tome ? pack.tomes.find((t) => t.id === keyword.tome) : undefined;
  const on = integrated(keyword.id);
  return (
    <>
      <PageHead kicker={family?.name ?? "Keyword"} title={keyword.name} lede={keyword.teaser} skipId={keyword.id} />
      <p className="mb-6 font-mono text-sm text-ink-3 uppercase">{on ? "Integrated" : "Still in the fog"}</p>
      {tome && keyword.num && (
        <p className="mb-6">
          Named in{" "}
          <GlossaryLink hit={{ kind: "tome", id: tome.id }} sec={keyword.num}>
            {tome.title} §{keyword.num}
            {keyword.page ? `, p. ${keyword.page}` : ""}
          </GlossaryLink>
          .
        </p>
      )}
      {!tome && <p className="mb-6 text-ink-2">No tome pointer yet. The keyword stands on its teaser alone.</p>}
      <button type="button" className="act" onClick={() => toggleIntegrated(keyword.id)}>
        {on ? "Return to the fog" : "Mark integrated"}
      </button>
    </>
  );
}
