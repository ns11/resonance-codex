import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/shell";

export const Route = createFileRoute("/$")({
  component: Missing,
});

function Missing() {
  return (
    <PageHead
      kicker="Codex"
      title="Not on this shelf"
      lede="That page is not in this lore. The bestiary, the figures, and the tomes are still where you left them."
    />
  );
}
