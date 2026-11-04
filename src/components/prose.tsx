import { useCodex } from "@/lib/codex";
import { linkParts } from "@/lib/lore/engine";
import { GlossaryLink } from "./glossary";

/** Running text. A known name is a glossary link: gilt or fog, never a button. */
export function Prose({ text, skipId }: { text: string; skipId?: string }) {
  const { pack } = useCodex();
  const parts = linkParts(text, pack, skipId);
  return (
    <>
      {parts.map((part, i) =>
        part.hit ? (
          <GlossaryLink key={i} hit={part.hit}>
            {part.text}
          </GlossaryLink>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
