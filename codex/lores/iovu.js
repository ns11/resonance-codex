/* Lore pack: Iovu (the job campaign). Named for Iov — Job, the man of Uz in the book of trials, who lost his house,
   his herds and his children, sat on the ash heap while three friends explained his fall to him, kept his word, and was
   answered out of the whirlwind and restored. The campaign is read the same way: a season of trials with a date on it.
   The data (the seven shelf books as tomes, the seven doctrines as families, the skill terms as keywords, the postings
   as cities) comes from CRETD-D through codex/lores/iovu-data.js. The board of the campaign sits in the Resonance Wings,
   in Alexander's chamber off the Araki Hall (codex/lores/iovu-board.js); this library has a plain door to it. */
(function () {
  'use strict';
  const D = window.IOVU_DATA || { tomes: [], families: [], keywords: [], cities: [], verify: [], campaign: {}, coverage: { avgPct: 0, measured: 0 } };
  window.CODEX_LORES = window.CODEX_LORES || {};
  const fam = D.families.map((f) => ({ id: f.id, name: f.name, hint: f.hint || '' }));
  const familyOf = {};
  for (const k of D.keywords) familyOf['iovu-' + k.id] = k.family;
  window.CODEX_LORES.iovu = {
    id: 'iovu',
    keeperOnly: true, /* 3.0.6: the campaign is the keeper's: a viewer meets no Iovu lore, in the menu, the list, the search or by URL */
    name: 'The Book of Iovu',
    short: 'Iovu',
    subject: 'The job campaign · CRETD-D',
    tagline: 'The campaign for a signed contract by 31 December 2026, read as the book of Iov: a season of trials with a date on it. The seven shelf books are the tomes, the doctrines the families, the skill terms of the live postings the bestiary, and every posting a city on the board’s map.',
    look: { accent: 'copper', ornament: 'lattice' },
    builtin: true,
    tomes: D.tomes,
    families: fam,
    familyOf,
    sections: ['bestiary', 'figures', 'library', 'tomes'],
    journal: [],
    suggested: [
      { tome: 'fournier', num: 'ch:1', why: 'The Manager’s Path opens with what to expect from a manager; read it before you are one, and before you say so in an interview.' },
      { tome: 'xu', num: 'ch:1', why: 'Scale from zero to millions of users: the chapter every backend and platform interview assumes you have read.' },
      { tome: 'ibryam', num: 'ch:1', why: 'The first Kubernetes pattern chapter sets the vocabulary the DevOps postings use.' },
      { tome: 'janca', num: 'ch:1', why: 'Security fundamentals in Janca’s plain words, for the AppSec and Response postings.' },
    ],
    library: {
      id: 'uz', name: 'The House of Uz', kind: 'library',
      blurb: 'Iov’s house in the land of Uz, after the storm. The Wing of the Comforters holds the front desk, your own answers and the ash heap where the real papers lie. The Door to the Wings is a plain door: behind it, in the Resonance library’s Araki Hall, sits the board of the campaign in Alexander’s chamber.',
      places: [
        { id: 'comforters-wing', kind: 'wing', name: 'Wing of the Comforters', aliases: ['Comforters Wing'], figures: ['iov'], year: '',
          blurb: 'Named for the three friends who sat with Iov seven days in silence and then explained his fall to him. The rooms hold what the campaign reads, what you write back, and what only the keeper keeps.',
          children: [
            { id: 'threshing-floor', kind: 'room', name: 'The Threshing Floor', role: 'open', desk: 'front',
              blurb: 'The front desk. Reading notes on postings, job descriptions, market reports and the books of the shelf, readable by everyone you share the codex with.' },
            { id: 'iovs-answer', kind: 'room', name: 'Iov’s Answer', role: 'own', desk: 'front',
              blurb: 'Your own writing: cover letters, the first-hundred-days memo, the two-sentence answers. Each item is yours alone until you share it.' },
            { id: 'ash-heap', kind: 'room', name: 'The Ash Heap', role: 'hidden', desk: 'back',
              blurb: 'The back desk, behind a sealed door. Your real CVs, the applications as sent, the offers as received. Only the keeper comes here.' },
          ] },
        { id: 'door-to-the-wings', kind: 'wing', name: 'The Door to the Wings', aliases: ['The Door'], figures: ['alexander'], year: '', role: 'hidden',
          door: { lore: 'resonance', place: 'chamber-alexander' },
          blurb: 'A plain door in the east wall. It opens on the Araki Hall of the Resonance library’s Wings, where the board of the campaign sits in Alexander’s chamber: five lenses, a map of the cities, and two vacant cells.' },
      ],
    },
    context: [
      'ABOUT THE KEEPER (Ellie): quantum-optics researcher in Chișinău with about a decade of engineering behind her (MLOps, datacentre infrastructure, Python and PHP backends, Kubernetes, a Fidelity past). MSc 2026 at the State University of Moldova, with a thesis awarded Summa Cum Laude (a lever a member may use only for what it is, a distinction on her master’s thesis, for example in a minister-level or state post in Moldova, a research-engineering post, or a visa case in the US or the UK; no member claims more than that); PhD applications for Fall 2027 in the United States run in parallel.',
      'THE CAMPAIGN (CRETD-D, "Raise Even The Dead"): ' + (D.campaign.objective || 'a signed contract by 31 December 2026; January is the outer limit.') + ' Two tracks: a job in Moldova now (private postings and state posts), and a US transfer corridor later (L-1 through an own entity, O-1A, H-1B).',
      'THE SEVEN DOCTRINES: PHP Remediation, Platform & Kubernetes, Data & ML Platform, AppSec & Response, Backend Line (Python, PHP), Public-Sector Command, Engineering Leadership. Each has one shelf book; two books per job family cover about ' + Math.round(D.coverage.avgPct) + '% of the skill terms in the ' + D.coverage.measured + ' open Moldovan postings measured (' + (D.asOf || 'this snapshot') + '; foreign seats are left out), so the gaps are named, not hidden.',
      'THE CITIES: every live posting is a city on the board’s map, taken or not. Dates are the real posting dates; pay is shown as the ad states it, otherwise a market estimate marked as such.',
      'Style she requires: plain, step-by-step full sentences, never compressed shorthand; a fact about a book carries its chapter and CHECK IN BOOK when the copy is not in hand; nothing invented about a person — where the record is silent, say so.',
    ].join('\n'),
    bookNames: D.tomes.map((t) => t.short).join(' | ') + ' | other',
    how: [
      'The tomes are the seven shelf books of the campaign. Their chapters are listed from knowledge of each edition, so every tome carries CHECK IN BOOK; integrate a chapter by sending Claude your notes on it.',
      'The bestiary holds the skill terms of the live postings, each under its doctrine. A term is discovered when a posting names it; it is studied when a book of the shelf has taught it to you.',
      'The library is the House of Uz: the Threshing Floor for what you read, Iov’s Answer for what you write, the Ash Heap for the real papers. The Door to the Wings leads to the board.',
      'The board sits in Alexander’s chamber in the Resonance Wings. Put a decision to a member’s cell and the record answers; Alexander alone also sees the Kudo side, the unknown: the gaps and the facts still to verify.',
    ],
  };

  /* the skill terms of the live postings, as discovered keywords of this lore */
  const C = window.Codex;
  if (!C) return;
  const day = D.generated || '2026-10-31';
  for (const k of D.keywords) {
    if (C.get('iovu-' + k.id)) continue;
    const shelf = (k.books || []).map((b) => (D.tomes.find((t) => t.id === b) || {}).short).filter(Boolean);
    C.register({
      id: 'iovu-' + k.id, kind: 'concept', lore: 'iovu', name: k.name, aliases: [], integrated: null, family: k.family, nolink: true, // skill terms are ordinary words (Go, APIs): never underlined by name
      teaser: (shelf.length ? 'Taught by ' + shelf.join(' and ') + ' on your shelf.' : k.suggest ? 'No shelf book teaches it; a third source is suggested: ' + k.suggest.t + ' (' + k.suggest.a + ').' : 'No shelf book teaches it.') + ' A skill term named in the live postings.',
      found: [{ session: true, note: 'Named in the skill map of the live postings, ' + (D.source || 'CRETD-D') + '.' }], readNext: [], steps: [], quiz: [],
    });
  }

  /* Iov, the namesake */
  if (!C.get('iov')) C.register({
    id: 'iov', kind: 'figure', lore: 'iovu', name: 'Iov', aliases: ['Iov din Uz', 'the man of Uz'], years: 'a figure of scripture', glyph: 'Ꙗ',
    role: 'Namesake of the House of Uz', place: 'comforters-wing', integrated: day, steps: [], quiz: [], found: [],
    teaser: 'The man of Uz in the Book of Job: he lost his house, his herds and his children in one day, kept his word through the trial, and was answered out of the whirlwind and restored.',
    bio: [
      'The Book of Job (Cartea lui Iov in the Romanian Bible) tells of a man of Uz, blameless and upright, whose wealth, children and health are taken from him in a wager he knows nothing about. He sits on the ash heap; three friends — Eliphaz, Bildad and Zophar — sit with him seven days in silence and then, in long speeches, explain that his fall must be deserved. A fourth, Elihu, speaks last. Iov refuses the explanation and demands an answer.',
      'The answer comes out of the whirlwind (chapters 38 to 41): not a reason, but the measure of the world. Iov submits; the friends are rebuked; his fortunes are restored twofold and he lives to see four generations (chapter 42). Chapter and verse numbers follow the standard division of the text; the campaign reads the book as a season of trials with an end written into it. CHECK the chapter numbers against your own copy.',
    ],
    why: 'The campaign is a season on the ash heap with a date on it: 31 December 2026. The comforters are the postings that explain what you lack; the whirlwind is the signed contract. The lore carries his name so that the trial is read as a book with a last chapter.',
    works: [{ year: '', title: 'The Book of Job', venue: 'Hebrew Bible, Ketuvim; 42 chapters', note: 'Prologue in chapters 1–2, the dialogues in 3–31, Elihu in 32–37, the whirlwind in 38–41, the restoration in 42.' }],
    related: [], links: [],
  });
})();
