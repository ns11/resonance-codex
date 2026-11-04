import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHead } from "@/components/shell";
import { useCodex } from "@/lib/codex";

export const Route = createFileRoute("/lores")({ component: Lores });

function Lores() {
  const { packs, pack, setLore } = useCodex();
  const navigate = useNavigate();
  return (
    <>
      <PageHead
        kicker="Engine"
        title="Lores"
        lede="The engine does not know the subject. A pack supplies the world: families, keywords, figures, a library, a shelf. Switching packs rebuilds the same screens."
      />
      <ul className="grid gap-3">
        {packs.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className={`flex w-full min-h-11 flex-col items-start border p-4 text-left ${
                p.id === pack.id ? "border-accent bg-raise" : "border-rule bg-surface"
              }`}
              onClick={() => {
                setLore(p.id);
                void navigate({ to: "/" });
              }}
            >
              <span className="font-mono text-xs tracking-widest text-accent uppercase">
                {p.subject}
                {p.id === pack.id ? " · open" : ""}
                {p.status === "draft" ? " · draft" : ""}
              </span>
              <span className="mt-1 font-display text-xl">{p.name}</span>
              <span className="mt-2 text-ink-2">{p.tagline}</span>
              <span className="mt-2 font-mono text-xs text-ink-3">
                {p.keywords.length} keywords · {p.tomes.length} tomes · {p.library.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
