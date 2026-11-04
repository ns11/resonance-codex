import type { Ornament as OrnamentKind } from "@/lib/lore/types";

const PATHS: Record<OrnamentKind, { d: string; vb: string }> = {
  spectrum: { vb: "0 0 46 14", d: "M7 13V9.5M15 13V6M23 13V1M31 13V6M39 13V9.5M1 13h44" },
  orbits: { vb: "0 0 46 14", d: "" },
  braces: { vb: "0 0 46 24", d: "M4 2c4 0 5 2 5 5s-1 5 4 5c-5 0-4 2-4 5s-1 5-5 5M42 2c-4 0-5 2-5 5s1 5-4 5c5 0 4 2 4 5s1 5 5 5M18 7h10" },
  lattice: { vb: "0 0 46 14", d: "M3 3h40M3 7h40M3 11h40M9 1v12M23 1v12M37 1v12" },
  wave: { vb: "0 0 46 14", d: "M1 7c4-6 7-6 11 0s7 6 11 0 7-6 11 0 7 6 11 0" },
  rings: { vb: "0 0 46 14", d: "" },
};

export function Ornament({ kind }: { kind: OrnamentKind }) {
  const spec = PATHS[kind] ?? PATHS.spectrum;
  return (
    <svg className="mt-3 h-4 text-accent" viewBox={spec.vb} aria-hidden>
      {kind === "orbits" ? (
        <>
          <ellipse cx="23" cy="7" rx="20" ry="4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="23" cy="7" rx="9" ry="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="23" cy="7" r="1.6" fill="currentColor" />
        </>
      ) : kind === "rings" ? (
        <>
          <circle cx="23" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="23" cy="7" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 7h12M33 7h12" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </>
      ) : (
        <path d={spec.d} fill="none" stroke="currentColor" strokeWidth="1.2" />
      )}
    </svg>
  );
}
