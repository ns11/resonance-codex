/* Lore pack: Resonance (quantum optics). A lore is everything the engine reads to build one world:
   the look, the tomes, the families of the bestiary, the library and its places, the cyclopedia sections,
   the journal tabs, the suggested reading and the context Claude gets in live calls.
   Swap the pack (or draft a new one from uploaded tomes) and the same engine builds a different codex. */
(function () {
  'use strict';
  window.CODEX_LORES = window.CODEX_LORES || {};
  window.CODEX_LORES.resonance = {
    id: 'resonance',
    name: 'Resonance Codex',
    short: 'Resonance',
    subject: 'Quantum optics',
    tagline: 'Your research, chapter by chapter. Sections of the books you integrate become entries; the techniques inside them get their own deep dives. Everything you have not reached yet stays in the fog as ????, the mark of a section not yet integrated.',
    look: { accent: 'gilt', ornament: 'spectrum' },
    builtin: true,
    tomes: window.CODEX_TOMES || [],
    families: [
      { id: 'light-atom', name: 'Light and atom', hint: 'How a driven atom moves.' },
      { id: 'decay-bath', name: 'Decay and the bath', hint: 'How the vacuum takes the energy away.' },
      { id: 'many-emitters', name: 'Many emitters', hint: 'What changes when atoms share the field.' },
      { id: 'light-out', name: 'The light that comes out', hint: 'Spectra, correlations and photon statistics.' },
      { id: 'uncharted', name: 'Uncharted', hint: 'New keywords from the crafting table and the library, not yet placed.' },
      /* collective beasts, after the companies of Eora: start-ups are the pirate confederation, consultancies the mercenary company, incumbents the chartered trading companies */
      { id: 'principi', name: 'Príncipi', hint: 'Start-ups, after the Príncipi sen Patrena, the pirate confederation of Deadfire: each ship its own captain, allied for plunder.', kind: 'company', crew: 'Captains' },
      { id: 'dozens', name: 'The Dozens', hint: 'Consulting companies, after the mercenary company of Defiance Bay: hired by the job.', kind: 'company', crew: 'Partners' },
      { id: 'companies', name: 'Trading Companies', hint: 'Established corporations, after the chartered Vailian Trading Company and Royal Deadfire Company: a Director and her executives.', kind: 'company', crew: 'Directors' },
    ],
    familyOf: {
      'rabi-oscillation': 'light-atom', 'dressed-states': 'light-atom', 'mixing-angle': 'light-atom', 'rwa': 'light-atom', 'interaction-picture': 'light-atom',
      'light-shift': 'light-atom', 'autler-townes': 'light-atom', 'jaynes-cummings': 'light-atom', 'bloch-sphere': 'light-atom', 'stimulated-spontaneous': 'light-atom',
      'decay-rate': 'decay-bath', 'master-equation': 'decay-bath', 'density-matrix': 'decay-bath', 'born-markov': 'decay-bath', 'secular-approximation': 'decay-bath',
      'quantum-jumps': 'decay-bath', 'mode-continuum': 'decay-bath', 'lamb-shift': 'decay-bath', 'purcell': 'decay-bath',
      'dipole-dipole': 'many-emitters', 'superradiance': 'many-emitters', 'subradiance': 'many-emitters', 'dicke-states': 'many-emitters',
      'mollow-triplet': 'light-out', 'elastic-scattering': 'light-out', 'g1-correlation': 'light-out', 'antibunching': 'light-out', 'qrt': 'light-out',
      'photon-wavefunction': 'light-out', 'causality': 'light-out', 'coherent-state': 'light-out',
    },
    sections: ['bestiary', 'figures', 'library', 'literature', 'crafted', 'tomes'],
    journal: ['overview', 'quests', 'review', 'dossier'],
    suggested: [
      { tome: 'sz', num: '6.2', why: 'The single-mode quantum model that §6.3 builds on: Rabi oscillations with a quantized field and the √(n+1) factor.' },
      { tome: 'sz', num: '5.6', why: 'A physical picture of stimulated emission and absorption, for your question about why emission takes time.' },
      { tome: 'sz', num: '10.2', why: 'The resonance fluorescence spectrum of one atom: the single-atom version of your five lines.' },
      { tome: 'sz', num: '8.2', why: 'Decay into thermal and squeezed reservoirs: §6.3 with photons already present.' },
      { tome: 'ct', num: 'ch:VI', why: 'The dressed-atom approach in full: the basis of your Chapter 3.' },
      { tome: 'bp', num: '3.3.1', why: 'The weak-coupling limit: where the Born, Markov and secular approximations are made precisely.' },
    ],
    /* The library: one building, three wings, one room in each; the Altar is the hidden heart of the Restricted Section.
       role: open = the front desk, readable by everyone the codex is shared with; own = your own writing, shared item by item;
       hidden = only you (the file list and the pages are stored where only the owner can read). */
    library: {
      id: 'sanctum', name: 'The Forgotten Sanctum', kind: 'library',
      blurb: 'A library in the manner of Deadfire’s Forgotten Sanctum. The Canc Lineas Wing holds the front desk, your writing, the restricted back desk and the two chambers of the Giants and the Lineage; the Engwithan Wing holds quantum computing; The Wings hold the chambers of the monks of the name, where only the keeper enters.',
      places: [
        { id: 'canc-lineas-wing', kind: 'wing', name: 'Canc Lineas Wing', aliases: ['Wing of the Five Lines', 'Canc Lineas'], figures: [], year: 2026,
          blurb: 'The Wing of the Five Lines, in Vailian: your own spectrum, (3.56)–(3.62). Its rooms are the front desk, your writing and the restricted back desk; its two chambers are kept by the Giants and by the Lineage of your problem.',
          children: [
            { id: 'central-stacks', kind: 'room', name: 'Central Stacks', role: 'open', desk: 'front',
              blurb: 'The front desk. Lecture notes, proceedings, reviews and theses, readable by everyone you share the codex with. Some you upload; some Claude writes from the codex.' },
            { id: 'scriptorium', kind: 'room', name: 'Scriptorium', role: 'own', desk: 'front',
              blurb: 'Your own writing: drafts, notes and statements. Each item is yours alone until you share it. A door leads to the Dossier.' },
            { id: 'restricted-section', kind: 'room', name: 'Restricted Section', role: 'hidden', desk: 'back',
              blurb: 'The back desk, behind a sealed door. Only the keeper comes here. Your real papers will lie here when you upload them.' },
            { id: 'chamber-a', kind: 'chamber', name: 'Chamber A · the Giants', role: 'hidden', desk: 'back', figures: ['scully', 'cohen-tannoudji', 'haroche', 'glauber'], roughs: 'wing', families: ['light-atom', 'decay-bath', 'light-out', 'many-emitters'], shelves: 'rows', supervisor: 'keitel',
              blurb: 'Nobody lives here. Rows of shelves, one per family, with rough drafts at the crossings of what you have studied, under the names of the giants of the field. Keitel and Lvovsky supervise from their cells.',
              children: [
                { id: 'cell-keitel', kind: 'cell', name: 'Keitel’s cell', role: 'hidden', desk: 'back', figures: ['keitel'], monk: 'keitel', roughs: 'monk', shelves: 'stack', blurb: 'A stack of books: roughs where cooperative and strong-field quantum optics cross what you have studied.' },
                { id: 'cell-lvovsky', kind: 'cell', name: 'Lvovsky’s cell', role: 'hidden', desk: 'back', figures: ['lvovsky'], monk: 'lvovsky', roughs: 'monk', shelves: 'stack', blurb: 'A stack of books: roughs where photon-based quantum optics, state tomography and quantum memory cross what you have studied.' },
              ] },
            { id: 'chamber-b', kind: 'chamber', name: 'Chamber B · the Lineage', role: 'hidden', desk: 'back', figures: ['dicke', 'lehmberg', 'agarwal'], roughs: 'wing', families: ['many-emitters', 'light-out'], shelves: 'rows', supervisor: 'ficek',
              blurb: 'Nobody lives here either. Rows of shelves with the roughs of your own problem’s lineage: superradiance, two-atom fluorescence, the cooperative master equation. Ficek supervises from his cell; Tanaś, who died in October 2026, keeps his.',
              children: [
                { id: 'cell-ficek', kind: 'cell', name: 'Ficek’s cell', role: 'hidden', desk: 'back', figures: ['ficek'], monk: 'ficek', roughs: 'monk', shelves: 'stack', blurb: 'A stack of books: roughs where two-atom entanglement and collective effects cross what you have studied.' },
                { id: 'cell-tanas', kind: 'cell', name: 'Tanaś’s cell', role: 'hidden', desk: 'back', figures: ['tanas'], monk: 'tanas', roughs: 'monk', shelves: 'stack', blurb: 'A stack of books: roughs where quantum interference in two-atom systems crosses what you have studied.' },
              ] },
          ] },
        { id: 'engwithan-wing', kind: 'wing', name: 'Engwithan Wing', aliases: ['Wing of the Engwithans'], figures: ['feynman', 'deutsch', 'shor'], year: 1982,
          blurb: 'Quantum computing, under the name of the ancient engineers of Eora who built the adra machines that compute with souls. Its front desk is the Cipher Stacks; its Chamber of Gates is named for the three who imagined the machine, and supervised from their cells by the two who proposed its first gate in 1995, out of your kind of physics; NIST built the first one.',
          children: [
            { id: 'cipher-stacks', kind: 'room', name: 'Cipher Stacks', role: 'open', desk: 'front',
              blurb: 'The front desk of the Engwithan Wing: notes, reviews and lecture notes on quantum computing and information, readable by everyone you share the codex with.' },
            { id: 'chamber-of-gates', kind: 'chamber', name: 'Chamber of Gates', role: 'hidden', desk: 'back', figures: ['feynman', 'deutsch', 'shor'], roughs: 'wing', families: ['light-atom', 'light-out'], shelves: 'rows', supervisor: 'cirac',
              blurb: 'Nobody lives here. Rows of shelves with rough drafts where what you have studied of driven atoms and their light crosses the gates and codes of quantum computing. Cirac and Zoller supervise from their cells.',
              children: [
                { id: 'cell-cirac', kind: 'cell', name: 'Cirac’s cell', role: 'hidden', desk: 'back', figures: ['cirac'], monk: 'cirac', roughs: 'monk', shelves: 'stack', blurb: 'A stack of books: roughs where the ion-trap gate and quantum networks cross what you have studied.' },
                { id: 'cell-zoller', kind: 'cell', name: 'Zoller’s cell', role: 'hidden', desk: 'back', figures: ['zoller'], monk: 'zoller', roughs: 'monk', shelves: 'stack', blurb: 'A stack of books: roughs where quantum simulation with atoms and photons crosses what you have studied.' },
              ] },
          ] },
        { id: 'araki-kudo-wing', kind: 'wing', name: 'The Wings', aliases: ['The Double Wings', 'The Araki–Kudo Wings', 'Araki–Kudo Wings', 'Araki-Kudo Wings'], figures: ['araki', 'kudo'], year: 1956, role: 'hidden',
          /* what the place is called depends on where you stand: everywhere else, simply The Wings; in the Araki Hall, The Double Wings (Araki knows there are two); in the Kudo Hall, the full name */
          names: { 'araki-hall': 'The Double Wings', 'kudo-hall': 'The Araki–Kudo Wings' },
          blurb: 'The wings of the monks of the name, after the two topologists of the Araki–Kudo operations; the rest of the library calls them simply The Wings. The Araki half is the known hidden: everyone sees the sealed door, only the keeper passes it. The Kudo half is the unknown hidden: on no map and in no index.',
          blurbViewer: 'The wings of the monks of the name; the rest of the library calls them simply The Wings. Everyone sees the sealed door; only the keeper passes it.',
          children: [
            { id: 'araki-hall', kind: 'hall', name: 'The Araki Hall', role: 'hidden', desk: 'back', figures: ['araki'], roughs: 'known',
              blurb: 'The known hidden. The chambers of the monks who work in or next to your field open off this hall: each a draft library, with rough drafts where their work crosses what you have studied.' },
            { id: 'kudo-hall', kind: 'hall', name: 'The Kudo Hall', aliases: ['Kudo Sanctum-Non-Sanctum', 'KSNS'], subtitle: 'Kudo Sanctum-Non-Sanctum (KSNS)', role: 'hidden', desk: 'back', figures: ['kudo'], roughs: 'unknown', secret: true,
              blurb: 'The unknown hidden, found only by the keeper: the Kudo Sanctum-Non-Sanctum, the only place where the Wings are called by their full name. The monks from farther fields keep their chambers here; their roughs cross their work with what you have only discovered.' },
          ] },
      ],
    },
    context: [
      'ABOUT THE RESEARCHER (Ellie): quantum-optics researcher. MSc thesis: cooperative resonance fluorescence of two dipole-dipole-coupled two-level emitters in the Dicke limit, driven by a detuned laser.',
      'Key thesis results: dressed states with mixing angle theta, cot 2theta = Delta/(2 Omega) (eq. 3.13); generalized Rabi frequency Omega~ = sqrt(Omega^2 + Delta^2/4); collective dressed ladder |E>,|S>,|G>; effective dipole-dipole coupling delta~ = delta (cos^2 2theta - sin^2 2theta/2) (3.33), which vanishes at tan^2 2theta = 2 (3.40); secular Lindblad master equation (3.47), written with Gamma = the full single-atom decay rate; five-line fluorescence spectrum (3.56)-(3.62); the elastic line (3.57) vanishes at theta = pi/4.',
      'PhD plan: N emitters, non-secular numerics, chains and rings beyond the Dicke limit, links to quantum computing.',
      'Core books: Scully & Zubairy "Quantum Optics"; Breuer & Petruccione "The Theory of Open Quantum Systems"; Cohen-Tannoudji, Dupont-Roc & Grynberg "Atom-Photon Interactions"; Loudon "The Quantum Theory of Light".',
      'Style she requires: plain, step-by-step full sentences, never compressed shorthand; page or equation numbers only when you are sure, otherwise the words CHECK IN BOOK.',
    ].join('\n'),
    bookNames: 'Scully & Zubairy | Breuer & Petruccione | Cohen-Tannoudji et al. | Loudon | other',
    how: [
      'Send Claude photos of a book section, as you did for §6.3. It becomes a section entry: a summary in plain words with the page and equation number on every point, CHECK IN BOOK flags, and the keywords it contains.',
      'Every keyword with an entry is underlined. A solid underline means integrated. A dotted underline with a small ? means discovered but not integrated yet: open it and press “Ask Claude to integrate”, or tell Claude in the chat.',
      'Each entry has a derivation path. Tick every step you have done on paper to reach <b>Derived</b> and reveal the deeper notes. Pass the quiz (at least 80%) to reach <b>Mastered</b> and reveal the mastery exercises.',
      'Every entry carries literature in three slots, for quantum optics and for quantum computing and information: the seminal paper, the most cited work since 2021, and the latest work of the last 12 months. Citation counts are snapshots; the source and date are shown.',
      'The library holds documents. Upload a paper in the Restricted Section and press “Send to Claude”: it comes back as reading notes with page numbers, its keywords join the Bestiary, and the original pages open beside the notes, for your eyes only.',
    ],
  };
})();
